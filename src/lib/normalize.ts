const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

export function normalizeInput(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeHyphenation(input: string): string {
  return input.replace(/–|—/g, '-').replace(/-{2,}/g, '-');
}

export function isSingleWord(input: string): boolean {
  return !/\s/.test(input) && Boolean(input);
}

export function toLemma(raw: string): string {
  const normalized = normalizeHyphenation(normalizeInput(raw));

  if (normalized.length <= 3) {
    return normalized;
  }

  if (normalized.endsWith('ies') && normalized.length > 4) {
    return normalized.slice(0, -3) + 'y';
  }

  if (normalized.endsWith('ing') && normalized.length > 5) {
    let stem = normalized.slice(0, -3);
    stem = stem.replace(/(.)\1$/, '$1');
    return stem;
  }

  if (normalized.endsWith('ed') && normalized.length > 4) {
    let stem = normalized.slice(0, -2);
    stem = stem.replace(/(.)\1$/, '$1');
    return stem;
  }

  if (normalized.endsWith('s') && normalized.length > 4) {
    return normalized.slice(0, -1);
  }

  return normalized;
}
