import { useCallback, useEffect, useState } from 'react';

interface StoredStats {
  runs: number;
  totalScore: number;
  totalTerms: number;
  bestScore: number;
}

const STORAGE_KEY = 'synonym-game::stats';

const defaultStats: StoredStats = {
  runs: 0,
  totalScore: 0,
  totalTerms: 0,
  bestScore: 0,
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
    (score: number, terms: number) => {
      persist({
        runs: stats.runs + 1,
        totalScore: stats.totalScore + score,
        totalTerms: stats.totalTerms + terms,
        bestScore: Math.max(stats.bestScore, score),
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
    registerRun,
  };
}
