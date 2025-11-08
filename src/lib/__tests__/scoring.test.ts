import { describe, expect, it } from 'vitest';
import { tierFromRarity, totalScore } from '../scoring';

describe('tierFromRarity', () => {
  it('maps ranges to tiers', () => {
    expect(tierFromRarity(0.1)).toBe('common');
    expect(tierFromRarity(0.5)).toBe('uncommon');
    expect(tierFromRarity(0.9)).toBe('rare');
  });
});

describe('totalScore', () => {
  it('sums found answer points', () => {
    const result = totalScore([
      { term: 'glad', lemma: 'glad', rarity: 0.2, tier: 'common', points: 1, submittedAt: 0 },
      { term: 'delighted', lemma: 'delight', rarity: 0.6, tier: 'uncommon', points: 2, submittedAt: 0 },
      { term: 'ecstatic', lemma: 'ecstatic', rarity: 0.9, tier: 'rare', points: 3, submittedAt: 0 },
    ]);
    expect(result).toBe(6);
  });
});
