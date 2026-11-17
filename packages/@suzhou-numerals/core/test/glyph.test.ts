import { describe, expect, it } from 'vitest';
import { digitStrokes, flatDigits } from '../src/index.js';

const lines = (digit: number, flat = false) =>
  digitStrokes(digit, flat).filter((s) => s.kind === 'line');
const circles = (digit: number) => digitStrokes(digit).filter((s) => s.kind === 'circle');
const upright = (s: { x1?: number; x2?: number }) => s.x1 === s.x2;

describe('digitStrokes', () => {
  it('draws zero as a circle', () => {
    expect(digitStrokes(0)).toEqual([{ kind: 'circle', cx: 0, cy: 0, r: 15 }]);
  });

  it.each([1, 2, 3])('draws %i as that many upright bars, or flat ones', (digit) => {
    expect(lines(digit)).toHaveLength(digit);
    expect(lines(digit).every(upright)).toBe(true);
    expect(lines(digit, true).some(upright)).toBe(false);
  });

  it('draws four as a cross', () => {
    expect(lines(4)).toHaveLength(2);
    expect(lines(4).some(upright)).toBe(false);
  });

  it('draws five as a bar on top of a circle', () => {
    expect(lines(5)).toHaveLength(1);
    expect(circles(5)).toHaveLength(1);
  });

  it.each([
    [6, 1],
    [7, 2],
    [8, 3],
  ])('draws %i as a bar on top of %i flat strokes', (digit, flat) => {
    const strokes = lines(digit);
    expect(strokes.filter(upright)).toHaveLength(1);
    expect(strokes.filter((s) => !upright(s))).toHaveLength(flat);
  });

  it('draws nine as a bar on top of a cross', () => {
    expect(lines(9).filter(upright)).toHaveLength(1);
    expect(lines(9)).toHaveLength(3);
  });

  it('ignores flat for digits other than 1, 2 and 3', () => {
    expect(digitStrokes(7, true)).toEqual(digitStrokes(7));
  });

  it.each([-1, 10, 1.5])('rejects %s', (digit) => {
    expect(() => digitStrokes(digit)).toThrow('0 to 9');
  });
});

describe('flatDigits', () => {
  it.each([
    [
      [2, 1],
      [false, true],
    ],
    [
      [1, 2, 3],
      [false, true, false],
    ],
    [
      [1, 1, 1, 1],
      [false, true, false, true],
    ],
    [
      [1, 5, 1],
      [false, false, false],
    ],
    [
      [3, 0, 2, 2],
      [false, false, false, true],
    ],
  ])('turns every second 1-3 in a run flat: %j', (digits, expected) => {
    expect(flatDigits(digits)).toEqual(expected);
  });
});
