import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchBaseWord, fetchSynonyms } from '../lib/aiClient';
import { normalizeHyphenation, normalizeInput, toLemma } from '../lib/normalize';
import { attachPoints, totalScore } from '../lib/scoring';
import type {
  FoundAnswer,
  RoundPhase,
  SynonymEntry,
  SynonymPayload,
} from '../types';
import { useCountdown } from './useCountdown';

type SubmissionFeedback =
  | {
      status: 'accepted';
      entry: FoundAnswer;
      message: string;
    }
  | {
      status: 'duplicate' | 'invalid' | 'empty' | 'multi';
      message: string;
    };

type RoundData = {
  payload: SynonymPayload | null;
  found: FoundAnswer[];
  phase: RoundPhase;
  isLoading: boolean;
  error: string | null;
  lastFeedback: SubmissionFeedback | null;
};

const ROUND_DURATION_MS = 60_000;

export function useRound(durationMs = ROUND_DURATION_MS) {
  const [round, setRound] = useState<RoundData>({
    payload: null,
    found: [],
    phase: 'idle',
    isLoading: false,
    error: null,
    lastFeedback: null,
  });
  const [roundId, setRoundId] = useState(0);

  const lookupRef = useRef<Map<string, SynonymEntry>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());
  const previousWordRef = useRef<string | undefined>(undefined);

  const handleExpire = useCallback(() => {
    setRound((prev) => {
      if (!prev.payload || prev.phase === 'ended') {
        return prev;
      }
      return { ...prev, phase: 'ended', lastFeedback: null };
    });
  }, []);

  const { remainingMs, isActive, start, reset } = useCountdown({
    durationMs,
    onExpired: handleExpire,
  });

  const loadRound = useCallback(async () => {
    setRound((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      lastFeedback: null,
      phase: 'idle',
      found: [],
    }));
    lookupRef.current = new Map();
    seenRef.current = new Set();
    reset();

    try {
      const word = await fetchBaseWord(previousWordRef.current);
      const payload = await fetchSynonyms(word);
      previousWordRef.current = payload.word;
      lookupRef.current = new Map(
        payload.synonyms.map((entry) => [entry.lemma, entry]),
      );
      setRound({
        payload,
        found: [],
        phase: 'ready',
        isLoading: false,
        error: null,
        lastFeedback: null,
      });
      setRoundId((prev) => prev + 1);
    } catch (err) {
      setRound((prev) => ({
        ...prev,
        isLoading: false,
        error:
          err instanceof Error ? err.message : 'Unable to fetch a new round.',
      }));
    }
  }, [reset]);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  const submitAnswer = useCallback(
    (rawValue: string): SubmissionFeedback => {
      if (!round.payload) {
        return { status: 'invalid', message: 'Still loading next word.' };
      }

      const normalized = normalizeInput(rawValue);

      if (!normalized) {
        const feedback = { status: 'empty', message: 'Type a synonym first.' } as SubmissionFeedback;
        setRound((prev) => ({ ...prev, lastFeedback: feedback }));
        return feedback;
      }

      if (/\s/.test(normalized)) {
        const feedback = {
          status: 'multi',
          message: 'Single-word answers only.',
        } as SubmissionFeedback;
        setRound((prev) => ({ ...prev, lastFeedback: feedback }));
        return feedback;
      }

      const lemma = toLemma(normalized);

      if (seenRef.current.has(lemma)) {
        const feedback = {
          status: 'duplicate',
          message: 'Already used that idea.',
        } as SubmissionFeedback;
        setRound((prev) => ({ ...prev, lastFeedback: feedback }));
        return feedback;
      }

      const entry = lookupRef.current.get(lemma);

      if (!entry) {
        const feedback = {
          status: 'invalid',
          message: 'Not in the canonical set.',
        } as SubmissionFeedback;
        setRound((prev) => ({ ...prev, lastFeedback: feedback }));
        return feedback;
      }

      seenRef.current.add(lemma);
      const withPoints = attachPoints(entry);
      const recorded: FoundAnswer = {
        ...withPoints,
        term: normalizeHyphenation(rawValue.trim()),
      };

      setRound((prev) => ({
        ...prev,
        phase: prev.phase === 'ready' ? 'running' : prev.phase,
        found: [...prev.found, recorded],
        lastFeedback: { status: 'accepted', entry: recorded, message: 'Nice!' },
      }));

      if (round.phase === 'ready') {
        start();
      }

      return { status: 'accepted', entry: recorded, message: 'Nice!' };
    },
    [round.payload, round.phase, start],
  );

  const missings = useMemo(() => {
    if (!round.payload) {
      return [];
    }
    const foundLemma = new Set(round.found.map((item) => item.lemma));
    return round.payload.synonyms
      .filter((item) => !foundLemma.has(item.lemma))
      .sort((a, b) => b.rarity - a.rarity);
  }, [round.found, round.payload]);

  const score = useMemo(() => totalScore(round.found), [round.found]);

  const notableMissed = useMemo(() => missings.slice(0, 5), [missings]);

  const playAgain = useCallback(() => {
    void loadRound();
  }, [loadRound]);

  return {
    roundId,
    phase: round.phase,
    baseWord: round.payload?.word ?? '',
    canonicalLemma: round.payload?.canonicalLemma ?? '',
    synonyms: round.payload?.synonyms ?? [],
    found: round.found,
    score,
    lastFeedback: round.lastFeedback,
    submitAnswer,
    playAgain,
    isLoading: round.isLoading,
    error: round.error,
    remainingMs,
    isTimerActive: isActive,
    missed: missings,
    notableMissed,
    expectedAnswers: round.payload?.synonyms.length ?? 0,
  };
}
