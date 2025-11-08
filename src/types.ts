export type RarityTier = 'common' | 'uncommon' | 'rare';

export interface SynonymEntry {
  term: string;
  lemma: string;
  tier: RarityTier;
  rarity: number;
}

export interface SynonymPayload {
  word: string;
  canonicalLemma: string;
  synonyms: SynonymEntry[];
  notes?: string;
}

export interface FoundAnswer extends SynonymEntry {
  points: number;
  submittedAt: number;
}

export interface MissedAnswer extends SynonymEntry {}

export type RoundPhase = 'idle' | 'ready' | 'running' | 'ended';
