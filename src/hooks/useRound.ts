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
  completion: 'give-up' | 'all-found' | null;
};

export function useRound() {
  const [round, setRound] = useState<RoundData>({
    payload: null,
    found: [],
    phase: 'idle',
    isLoading: false,
    error: null,
    lastFeedback: null,
    completion: null,
  });
  const [roundId, setRoundId] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const lookupRef = useRef<Map<string, SynonymEntry>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());
  const previousWordRef = useRef<string | undefined>(undefined);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = null;
    setElapsedMs(0);
  }, [stopTimer]);

  const freezeElapsed = useCallback(() => {
    if (startedAtRef.current) {
      setElapsedMs(Date.now() - startedAtRef.current);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (startedAtRef.current) {
      return;
    }
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = window.setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 100);
    setRound((prev) => ({
      ...prev,
      phase: prev.phase === 'ready' ? 'running' : prev.phase,
    }));
  }, []);

  const finalizeRound = useCallback(
    (reason: 'give-up' | 'all-found') => {
      freezeElapsed();
      stopTimer();
      setRound((prev) => {
        if (prev.phase === 'ended' && prev.completion === reason) {
          return prev;
        }
        return {
          ...prev,
          phase: 'ended',
          completion: reason,
          lastFeedback: reason === 'give-up' ? null : prev.lastFeedback,
        };
      });
    },
    [freezeElapsed, stopTimer],
  );

  const loadRound = useCallback(async () => {
    setRound((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      lastFeedback: null,
      phase: 'idle',
      found: [],
      completion: null,
    }));
    lookupRef.current = new Map();
    seenRef.current = new Set();
    resetTimer();

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
        completion: null,
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
  }, [resetTimer]);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  useEffect(
    () => () => {
      stopTimer();
    },
    [stopTimer],
  );

  const registerTyping = useCallback(() => {
    if (round.phase === 'ended') {
      return;
    }
    startTimer();
  }, [round.phase, startTimer]);

  const submitAnswer = useCallback(
    (rawValue: string): SubmissionFeedback => {
      if (!round.payload) {
        return { status: 'invalid', message: 'Still loading next word.' };
      }

      if (!startedAtRef.current) {
        startTimer();
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

      let shouldComplete = false;

      setRound((prev) => {
        const updatedFound = [...prev.found, recorded];
        if (prev.payload && updatedFound.length >= prev.payload.synonyms.length) {
          shouldComplete = true;
        }
        return {
          ...prev,
          phase: prev.phase === 'ready' ? 'running' : prev.phase,
          found: updatedFound,
          lastFeedback: { status: 'accepted', entry: recorded, message: 'Nice!' },
        };
      });

      if (shouldComplete) {
        finalizeRound('all-found');
      }

      return { status: 'accepted', entry: recorded, message: 'Nice!' };
    },
    [finalizeRound, round.payload, startTimer],
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

  const giveUp = useCallback(() => {
    finalizeRound('give-up');
  }, [finalizeRound]);

  const totalAnswers = round.payload?.synonyms.length ?? 0;
  const completedAll = round.phase === 'ended' && round.completion === 'all-found';

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
    elapsedMs,
    registerTyping,
    giveUp,
    completion: round.completion,
    completedAll,
    missed: missings,
    notableMissed,
    expectedAnswers: totalAnswers,
  };
}
