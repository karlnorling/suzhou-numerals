import { describe, expect, it } from 'vitest';
import { parseGradient } from '../src/index.js';
import { resolvePaint } from '../src/paint.js';

const wide = { x: -10, y: -10, width: 130, height: 100 };
const narrow = { x: -10, y: -10, width: 60, height: 100 };

describe('parseGradient', () => {
  it('ignores plain colours', () => {
    expect(parseGradient('#c00')).toBeUndefined();
    expect(parseGradient('rgb(1, 2, 3)')).toBeUndefined();
  });

  it('reads a linear gradient with an angle and stop positions', () => {
    expect(parseGradient('linear-gradient(90deg, red, rgb(0, 0, 255) 75%)')).toEqual({
      type: 'linear',
      angle: 90,
      stops: [{ color: 'red' }, { color: 'rgb(0, 0, 255)', offset: 0.75 }],
    });
  });

  it.each([
    ['to top', 0],
    ['to right', 90],
    ['to bottom', 180],
    ['to left', -90],
    ['to bottom right', 135],
    ['0.25turn', 90],
  ])('reads the direction %s', (direction, angle) => {
    expect(parseGradient(`linear-gradient(${direction}, red, blue)`)?.angle).toBeCloseTo(angle);
  });

  it('reads a radial gradient and skips its shape', () => {
    expect(parseGradient('Radial-Gradient(circle at center, gold, crimson)')).toEqual({
      type: 'radial',
      stops: [{ color: 'gold' }, { color: 'crimson' }],
    });
  });

  it('reads two positions on one stop as a hard-edged band', () => {
    expect(parseGradient('repeating-linear-gradient(45deg, red 0 10%, white 10% 20%)')).toEqual({
      type: 'linear',
      angle: 45,
      repeat: true,
      stops: [
        { color: 'red', offset: 0 },
        { color: 'red', offset: 0.1 },
        { color: 'white', offset: 0.1 },
        { color: 'white', offset: 0.2 },
      ],
    });
  });

  it('rejects a gradient without colours', () => {
    expect(() => parseGradient('linear-gradient(90deg)')).toThrow('at least one colour');
  });
});

describe('resolvePaint', () => {
  it('passes plain colours through', () => {
    expect(resolvePaint('#c00', wide, 'p')).toEqual({ value: '#c00', def: '' });
  });

  it('runs a linear gradient edge to edge across the box', () => {
    const { value, def } = resolvePaint('linear-gradient(to right, #f00, #00f)', wide, 'p');
    const id = /id="([^"]+)"/.exec(def)?.[1];
    expect(id).toMatch(/^p-/);
    expect(value).toBe(`url(#${id})`);
    expect(def).toBe(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="-10" y1="40" x2="120" y2="40"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/></linearGradient>`,
    );
  });

  it('defaults to top-to-bottom and spaces stops evenly', () => {
    const { def } = resolvePaint(
      { stops: ['red', 'lime', { color: 'blue', offset: 0.9 }] },
      narrow,
      'p',
    );
    expect(def).toContain('x1="20" y1="-10" x2="20" y2="90"');
    expect(def).toContain(
      '<stop offset="0" stop-color="red"/><stop offset="0.45" stop-color="lime"/><stop offset="0.9" stop-color="blue"/>',
    );
  });

  it('draws a radial gradient from the centre out to the corners', () => {
    expect(resolvePaint('radial-gradient(white, black)', narrow, 'p').def).toMatch(
      /<radialGradient id="p-\w+" gradientUnits="userSpaceOnUse" cx="20" cy="40" r="58.31">/,
    );
  });

  it('draws one period of a repeating gradient and repeats it', () => {
    const { def } = resolvePaint(
      'repeating-linear-gradient(red 0 10%, white 10% 20%)',
      narrow,
      'p',
    );
    expect(def).toContain('spreadMethod="repeat" x1="20" y1="-10" x2="20" y2="10"');
  });

  it('shrinks a repeating radial gradient to its last stop', () => {
    const { def } = resolvePaint('repeating-radial-gradient(red 0 5%, white 5% 10%)', narrow, 'p');
    expect(def).toContain('spreadMethod="repeat" cx="20" cy="40" r="5.831"');
  });

  it('rejects a repeating gradient with no length', () => {
    expect(() => resolvePaint('repeating-linear-gradient(red 10%, blue 10%)', narrow, 'p')).toThrow(
      'span some distance',
    );
  });

  it('gives different gradients different ids, and keeps them stable', () => {
    const a = resolvePaint('linear-gradient(red, blue)', narrow, 'p');
    expect(resolvePaint('linear-gradient(red, blue)', narrow, 'p')).toEqual(a);
    expect(resolvePaint('linear-gradient(red, green)', narrow, 'p').value).not.toBe(a.value);
  });

  it('escapes colours inside the stops', () => {
    expect(resolvePaint('linear-gradient("><x, red)', narrow, 'p').def).toContain(
      'stop-color="&#34;&#62;&#60;x"',
    );
  });
});
