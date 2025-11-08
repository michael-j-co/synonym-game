import { useCallback, useEffect, useState } from 'react';

interface StoredStats {
  runs: number;
  totalScore: number;
  totalTerms: number;
  bestScore: number;
  totalTimeMs: number;
  fastestMs: number;
}

const STORAGE_KEY = 'synonym-game::stats';

const defaultStats: StoredStats = {
  runs: 0,
  totalScore: 0,
  totalTerms: 0,
  bestScore: 0,
  totalTimeMs: 0,
  fastestMs: 0,
};

export function useLocalStore() {
  const [stats, setStats] = useState<StoredStats>(defaultStats);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredStats;
        setStats({ ...defaultStats, ...parsed });
      }
    } catch {
      setStats(defaultStats);
    }
  }, []);

  const persist = useCallback((next: StoredStats) => {
    setStats(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors in MVP
    }
  }, []);

  const registerRun = useCallback(
    (score: number, terms: number, durationMs: number) => {
      const nextRuns = stats.runs + 1;
      const nextTotalTime = stats.totalTimeMs + durationMs;
      const nextFastest =
        stats.fastestMs === 0 ? durationMs : Math.min(stats.fastestMs, durationMs);
      persist({
        runs: nextRuns,
        totalScore: stats.totalScore + score,
        totalTerms: stats.totalTerms + terms,
        bestScore: Math.max(stats.bestScore, score),
        totalTimeMs: nextTotalTime,
        fastestMs: nextFastest,
      });
    },
    [persist, stats],
  );

  return {
    stats,
    bestScore: stats.bestScore,
    runs: stats.runs,
    avgScore: stats.runs ? Math.round(stats.totalScore / stats.runs) : 0,
    avgTerms: stats.runs
      ? Number((stats.totalTerms / stats.runs).toFixed(1))
      : 0,
    avgTimeMs: stats.runs ? Math.round(stats.totalTimeMs / stats.runs) : 0,
    fastestMs: stats.fastestMs,
    registerRun,
  };
}
