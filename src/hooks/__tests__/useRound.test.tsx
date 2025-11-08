import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRound } from '../useRound';

const mockPayload = {
  word: 'happy',
  canonicalLemma: 'happy',
  synonyms: [
    { term: 'glad', lemma: 'glad', tier: 'common', rarity: 0.2 },
    { term: 'delighted', lemma: 'delight', tier: 'uncommon', rarity: 0.5 },
  ],
};

vi.mock('../../lib/aiClient', () => ({
  fetchBaseWord: vi.fn(async () => 'happy'),
  fetchSynonyms: vi.fn(async () => mockPayload),
}));

describe('useRound timer behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('starts the timer on first typing and does not reset on later keystrokes', async () => {
    const { result } = renderHook(() => useRound());
    await waitFor(() => expect(result.current.phase).toBe('ready'));

    act(() => {
      result.current.registerTyping();
    });

    vi.advanceTimersByTime(600);
    await waitFor(() => expect(result.current.elapsedMs).toBeGreaterThan(0));
    const snapshot = result.current.elapsedMs;

    act(() => {
      result.current.registerTyping();
    });
    vi.advanceTimersByTime(400);

    expect(result.current.elapsedMs).toBeGreaterThan(snapshot);
  });

  it('freezes elapsed time when the player gives up', async () => {
    const { result } = renderHook(() => useRound());
    await waitFor(() => expect(result.current.phase).toBe('ready'));

    act(() => {
      result.current.registerTyping();
    });
    vi.advanceTimersByTime(1200);
    act(() => {
      result.current.giveUp();
    });

    const frozen = result.current.elapsedMs;
    vi.advanceTimersByTime(2000);

    expect(result.current.elapsedMs).toBe(frozen);
    expect(result.current.phase).toBe('ended');
  });

  it('auto-completes the round and stops the clock when every synonym is found', async () => {
    const { result } = renderHook(() => useRound());
    await waitFor(() => expect(result.current.phase).toBe('ready'));

    act(() => {
      result.current.registerTyping();
    });

    act(() => {
      result.current.submitAnswer('glad');
      result.current.submitAnswer('delighted');
    });

    await waitFor(() => expect(result.current.completedAll).toBe(true));
    const frozen = result.current.elapsedMs;
    vi.advanceTimersByTime(1000);

    expect(result.current.elapsedMs).toBe(frozen);
    expect(result.current.phase).toBe('ended');
  });
});
