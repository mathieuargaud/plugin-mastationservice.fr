import { describe, it, expect } from 'vitest';
import { formaterPrix, formaterDistance, formaterAge } from '../src/format.js';

describe('formaterPrix', () => {
  it('trois décimales et virgule', () => {
    expect(formaterPrix(1.789)).toBe('1,789 €');
    expect(formaterPrix(2)).toBe('2,000 €');
  });
});

describe('formaterDistance', () => {
  it('une décimale, 0,1 km minimum', () => {
    expect(formaterDistance(3.24)).toBe('3,2 km');
    expect(formaterDistance(0.05)).toBe('0,1 km');
  });
});

describe('formaterAge', () => {
  const now = new Date('2026-11-11T12:00:00Z');
  it('minutes, heures, jours', () => {
    expect(formaterAge('2026-11-11T11:55:00Z', now)).toBe('il y a 5 min');
    expect(formaterAge('2026-11-11T11:59:50Z', now)).toBe("à l'instant");
    expect(formaterAge('2026-11-11T10:00:00Z', now)).toBe('il y a 2 h');
    expect(formaterAge('2026-11-08T12:00:00Z', now)).toBe('il y a 3 j');
  });
});
