import { describe, it, expect } from 'vitest';
import { extractUTM } from '../../src/utils/utm';

describe('UTM', () => {
  it('extracts params', () => {
    const utm = extractUTM(new URL('https://x.com/?utm_source=google&utm_medium=cpc'));
    expect(utm.utm_source).toBe('google');
    expect(utm.utm_medium).toBe('cpc');
  });
  it('returns empty for no params', () => {
    expect(Object.keys(extractUTM(new URL('https://x.com/'))).length).toBe(0);
  });
});
