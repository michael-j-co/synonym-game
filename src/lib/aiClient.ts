import mockSynonyms from '../data/mockSynonyms.json';
import type { SynonymPayload } from '../types';
import { getRandomWord } from './wordbank';

const payloads = mockSynonyms as Record<string, SynonymPayload>;
const cache = new Map<string, SynonymPayload>();

const MIN_DELAY = 120;
const MAX_DELAY = 320;

async function simulateLatency(): Promise<void> {
  const delay = Math.floor(
    MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY),
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function fetchBaseWord(previous?: string): Promise<string> {
  await simulateLatency();
  return getRandomWord(previous);
}

export async function fetchSynonyms(word: string): Promise<SynonymPayload> {
  if (cache.has(word)) {
    return cache.get(word)!;
  }

  await simulateLatency();
  const payload = payloads[word];

  if (!payload) {
    throw new Error(`Synonyms unavailable for “${word}” in mock dataset.`);
  }

  cache.set(word, payload);
  return payload;
}
