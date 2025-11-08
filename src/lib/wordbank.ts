import words from '../data/wordbank.json';

const fallbackWord = words[0];

export function getWordList(): string[] {
  return words;
}

export function getRandomWord(exclude?: string): string {
  if (words.length <= 1) {
    return fallbackWord;
  }

  let candidate = exclude ?? fallbackWord;
  while (candidate === exclude) {
    const index = Math.floor(Math.random() * words.length);
    candidate = words[index];
  }
  return candidate;
}
