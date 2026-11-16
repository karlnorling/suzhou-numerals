import { describe, expect, it } from 'vitest';
import { digitSvg, toSvg } from '../src/index.js';

const attr = (svg: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(svg)?.[1];

describe('toSvg', () => {
  it('renders one digit 100px tall by default', () => {
    const svg = toSvg(1);
    expect(attr(svg, 'viewBox')).toBe('-20 -20 84 100');
    expect(attr(svg, 'height')).toBe('100');
    expect(svg).toContain('<title>1</title>');
    expect(attr(svg, 'd')).toBe('M22 2L22 58');
    expect(attr(svg, 'stroke')).toBe('currentColor');
  });

  it('writes the second of two neighbouring 1-3s flat', () => {
    // 21: 〢一
    expect(attr(toSvg(21), 'd')).toBe('M15 2L15 58M29 2L29 58M60 30L96 30');
    expect(attr(toSvg(21, { alternate: false }), 'd')).toBe('M15 2L15 58M29 2L29 58M78 2L78 58');
  });

  it('draws zero as a circle', () => {
    expect(toSvg(305)).toContain('<circle cx="78" cy="30" r="15"/>');
  });

  it('puts a dot on the baseline before the fraction', () => {
    const svg = toSvg(1.5);
    expect(svg).toMatch(/<circle cx="[\d.]+" cy="60" r="5" fill="currentColor"\/>/);
    expect(svg).toContain('<title>1.5</title>');
  });

  it('strikes the last digit of a negative number', () => {
    expect(attr(toSvg(-4), 'd')).toMatch(/M-4 64L48 -4$/);
  });

  it('takes backgrounds and gradients', () => {
    const svg = toSvg(5, { color: 'linear-gradient(red, blue)', background: '#fff' });
    expect(attr(svg, 'stroke')).toMatch(/^url\(#suzhou-color-\w+\)$/);
    expect(svg).toContain('fill="#fff"');
  });

  it.each([
    [{ size: 0 }, 'size must be positive'],
    [{ strokeWidth: 0 }, 'strokeWidth must be positive'],
  ])('rejects %j', (options, message) => {
    expect(() => toSvg(1, options)).toThrow(message);
  });
});

describe('digitSvg', () => {
  it('draws one upright digit', () => {
    expect(digitSvg(3)).toContain('<title>3</title>');
    expect(attr(digitSvg(1), 'd')).toBe('M22 2L22 58');
  });
});
