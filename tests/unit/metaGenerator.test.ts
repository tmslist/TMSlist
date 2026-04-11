import { describe, it, expect } from 'vitest';
import { clinicMetaTitle, clinicMetaDescription, stateMetaTitle, cityMetaTitle } from '../../src/utils/metaGenerator';

describe('Meta Generator', () => {
  it('generates clinic meta title', () => {
    const t = clinicMetaTitle({ name: 'Brain Health', city: 'Austin', state: 'TX' });
    expect(t).toContain('Brain Health');
    expect(t).toContain('Austin');
  });
  it('keeps description under 160 chars', () => {
    const d = clinicMetaDescription({ name: 'Brain Health', city: 'Austin', state: 'TX', ratingAvg: '4.5', reviewCount: 10, machines: ['NeuroStar'] });
    expect(d.length).toBeLessThanOrEqual(160);
  });
  it('generates state title with count', () => {
    expect(stateMetaTitle('California', 150)).toContain('150');
  });
  it('generates city title', () => {
    expect(cityMetaTitle('LA', 'CA', 25)).toContain('LA');
  });
});
