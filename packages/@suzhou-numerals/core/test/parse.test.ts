import { describe, expect, it } from 'vitest';
import { formatInBase, parseInBase } from '../src/parse.js';

describe('parseInBase', () => {
  it.each([
    [0, 20, [0], []],
    [19, 20, [19], []],
    [20, 20, [1, 0], []],
    [1993, 20, [4, 19, 13], []],
    [3600, 60, [1, 0, 0], []],
    [0.5, 20, [0], [10]],
    [0.01, 20, [0], [0, 4]],
    [0.1, 60, [0], [6]],
    [12.5, 60, [12], [30]],
    [305, 10, [3, 0, 5], []],
  ])('writes %s in base %i', (value, base, integer, fraction) => {
    expect(parseInBase(value, base)).toEqual({ negative: false, integer, fraction });
  });

  it('keeps every digit of strings and bigints', () => {
    expect(parseInBase('123456789012345678901234567890', 10).integer).toHaveLength(30);
    expect(parseInBase(2n ** 70n, 60).integer).toHaveLength(12);
  });

  it('reads signs, exponents and underscores', () => {
    expect(parseInBase('-1_000', 10)).toEqual({
      negative: true,
      integer: [1, 0, 0, 0],
      fraction: [],
    });
    expect(parseInBase('1.5e2', 20).integer).toEqual([7, 10]);
    expect(parseInBase(1e-7, 10).fraction).toHaveLength(7);
  });

  it('treats negative zero as zero', () => {
    expect(parseInBase('-0.000', 20)).toEqual({ negative: false, integer: [0], fraction: [] });
  });

  it.each(['', '.', 'abc', '1,5', '--1', '1e'])('rejects %j', (text) => {
    expect(() => parseInBase(text, 10)).toThrow('Not a decimal number');
  });

  it.each([Number.NaN, Infinity])('rejects %s', (value) => {
    expect(() => parseInBase(value, 10)).toThrow('Not a finite number');
  });

  it('rejects fractions with no finite expansion', () => {
    expect(() => parseInBase('0.1', 3)).toThrow('no finite expansion');
  });
});

describe('formatInBase', () => {
  it.each([
    ['1993', 20],
    ['-12.5', 60],
    ['0.0005', 20],
    ['3.14159', 60],
    ['0', 10],
    ['123456789012345678901234567890.25', 20],
  ])('round-trips %s through base %i', (text, base) => {
    expect(formatInBase(parseInBase(text, base), base)).toBe(text);
  });
});
