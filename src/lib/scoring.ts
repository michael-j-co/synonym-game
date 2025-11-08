import type { FoundAnswer, RarityTier, SynonymEntry } from '../types';

export const DEFAULT_POINTS: Record<RarityTier, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
};

export function tierFromRarity(rarity: number): RarityTier {
  if (rarity <= 0.33) {
    return 'common';
  }
  if (rarity <= 0.66) {
    return 'uncommon';
  }
  return 'rare';
}

export function pointsForTier(tier: RarityTier): number {
  return DEFAULT_POINTS[tier];
}

export function attachPoints(entry: SynonymEntry): FoundAnswer {
  return {
    ...entry,
    points: pointsForTier(entry.tier),
    submittedAt: Date.now(),
  };
}

export function totalScore(entries: FoundAnswer[]): number {
  return entries.reduce((sum, item) => sum + item.points, 0);
}
