import { describe, it, expect } from 'vitest';
import { getCanonicalUrl } from '../../src/utils/canonical';

describe('Canonical URL', () => {
  it('removes trailing slashes', () => { expect(getCanonicalUrl('/us/california/')).toBe('https://tmslist.com/us/california'); });
  it('lowercases paths', () => { expect(getCanonicalUrl('/US/California')).toBe('https://tmslist.com/us/california'); });
  it('preserves root', () => { expect(getCanonicalUrl('/')).toBe('https://tmslist.com/'); });
});
