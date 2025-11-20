import { describe, expect, it } from 'vitest';
import { normalizeInput, toLemma } from '../normalize';

describe('normalizeInput', () => {
  it('lowercases and trims', () => {
    expect(normalizeInput('  Happy  ')).toBe('happy');
  });

  it('strips diacritics', () => {
    expect(normalizeInput('Jubilánt')).toBe('jubilant');
  });
});

describe('toLemma', () => {
  it('handles plural nouns', () => {
    expect(toLemma('smiles')).toBe('smile');
  });

  it('handles gerunds', () => {
    expect(toLemma('running')).toBe('run');
  });
});
