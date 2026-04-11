import { describe, it, expect } from 'vitest';
import { calculateBadges } from '../../src/utils/badges';

describe('calculateBadges', () => {
  it('returns empty for new clinic', () => { expect(calculateBadges({})).toHaveLength(0); });
  it('returns top-rated for high rating with reviews', () => {
    expect(calculateBadges({ ratingAvg: '4.7', reviewCount: 10 }).some(b => b.id === 'top-rated')).toBe(true);
  });
  it('returns verified badge', () => {
    expect(calculateBadges({ verified: true }).some(b => b.id === 'verified')).toBe(true);
  });
  it('does not return top-rated for low review count', () => {
    expect(calculateBadges({ ratingAvg: '4.8', reviewCount: 2 }).some(b => b.id === 'top-rated')).toBe(false);
  });
});
