import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as aiClient from '../../lib/aiClient';
import { useRound } from '../useRound';

const mockPayload = {
  word: 'happy',
  canonicalLemma: 'happy',
  synonyms: [
    { term: 'glad', lemma: 'glad', tier: 'common', rarity: 0.2 },
    { term: 'delighted', lemma: 'delight', tier: 'uncommon', rarity: 0.5 },
  ],
};

describe('useRound timer behavior', () => {
  let baseWordSpy: ReturnType<typeof vi.spyOn>;
  let synonymsSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    baseWordSpy = vi
      .spyOn(aiClient, 'fetchBaseWord')
      .mockResolvedValue('happy');
    synonymsSpy = vi
      .spyOn(aiClient, 'fetchSynonyms')
      .mockResolvedValue(mockPayload);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    baseWordSpy.mockRestore();
    synonymsSpy.mockRestore();
  });

  it('starts the timer as soon as a new round is ready', async () => {
    const { result } = renderHook(() => useRound());
    await act(async () => {});
    expect(result.current.phase).toBe('running');

    expect(result.current.elapsedMs).toBe(0);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.elapsedMs).toBeGreaterThan(0);
    const snapshot = result.current.elapsedMs;

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.elapsedMs).toBeGreaterThan(snapshot);
  });

  it('freezes elapsed time when the player gives up', async () => {
    const { result } = renderHook(() => useRound());
    await act(async () => {});
    expect(result.current.phase).toBe('running');

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    act(() => {
      result.current.giveUp();
    });

    const frozen = result.current.elapsedMs;
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.elapsedMs).toBe(frozen);
    expect(result.current.phase).toBe('ended');
  });

  it('auto-completes the round and stops the clock when every synonym is found', async () => {
    const { result } = renderHook(() => useRound());
    await act(async () => {});
    expect(result.current.phase).toBe('running');

    act(() => {
      result.current.submitAnswer('glad');
      result.current.submitAnswer('delighted');
    });

    await act(async () => {});
    expect(result.current.completedAll).toBe(true);
    const frozen = result.current.elapsedMs;
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.elapsedMs).toBe(frozen);
    expect(result.current.phase).toBe('ended');
  });
});
