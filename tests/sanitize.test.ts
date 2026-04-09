import { describe, it, expect } from 'vitest';
import { escapeHtml, stripHtml, formatPhone } from '../src/utils/sanitize';

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's fine")).toBe("it&#39;s fine");
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('leaves clean text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><a href="x">link</a></div>')).toBe('link');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('formatPhone', () => {
  it('formats 10-digit number', () => {
    expect(formatPhone('2145551234')).toBe('(214) 555-1234');
  });

  it('formats number with existing formatting', () => {
    expect(formatPhone('(214) 555-1234')).toBe('(214) 555-1234');
  });

  it('formats 11-digit number starting with 1', () => {
    expect(formatPhone('12145551234')).toBe('(214) 555-1234');
  });

  it('returns original for non-standard numbers', () => {
    expect(formatPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958');
  });

  it('handles dashes and spaces', () => {
    expect(formatPhone('214-555-1234')).toBe('(214) 555-1234');
  });
});
