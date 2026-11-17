import { CELL_HEIGHT, CELL_WIDTH, digitStrokes, flatDigits, type Stroke } from './glyph.js';
import { format, parse } from './number.js';
import { escapeAttr as escape, num, resolvePaint, type Paint } from './paint.js';
import type { NumberInput } from './parse.js';

export interface SvgOptions {
  /** Height of the image in pixels. The width follows from the number of places. Default 100. */
  size?: number;
  /**
   * Stroke colour. Default `currentColor`, so the SVG takes the surrounding text colour.
   * Also takes a CSS gradient such as `linear-gradient(to right, gold, crimson)`, or a
   * gradient object.
   */
  color?: Paint;
  /** Fills the image behind the numeral: a colour or a gradient. Default: transparent. */
  background?: Paint;
  /** Stroke width in viewBox units, where a digit is 60 tall. Default 5. */
  strokeWidth?: number;
  /** Space between places in viewBox units. Default 12. */
  gap?: number;
  /** Space around the numeral in viewBox units. Default 20. */
  padding?: number;
  /**
   * Turn every second 1, 2 or 3 in a run on its side, as Suzhou writers do, so 21 is 〢一
   * rather than 〢〡. Default true.
   */
  alternate?: boolean;
  /**
   * Accessible name, rendered as `<title>`. Defaults to the number written in decimal.
   * Pass `false` to leave it out and hide the image from assistive technology.
   */
  title?: string | false;
}

interface Cell {
  strokes: Stroke[];
  x: number;
}

/**
 * Renders a number as an SVG string of Suzhou numerals (蘇州碼子).
 *
 * Digits run left to right, most significant first. A dot on the baseline marks the
 * decimal point, and a negative number has a diagonal stroke across its last digit,
 * as on the counting rods Suzhou numerals grew out of.
 */
export function toSvg(value: NumberInput, options: SvgOptions = {}): string {
  const number = parse(value);
  const { gap = 12, strokeWidth = 5, alternate = true } = options;
  const digits = [...number.integer, ...number.fraction];
  const flat = alternate ? flatDigits(digits) : digits.map(() => false);

  const cells: Cell[] = [];
  let x = 0;
  let dot: number | undefined;
  digits.forEach((digit, i) => {
    if (i === number.integer.length) {
      const r = strokeWidth;
      x += gap / 2 + r;
      dot = x;
      x += r + gap / 2;
    } else if (i > 0) {
      x += gap;
    }
    cells.push({ strokes: digitStrokes(digit, flat[i]), x });
    x += CELL_WIDTH;
  });
  return render(cells, x, number.negative, dot, options, format(number));
}

/** One digit from 0 to 9 on its own, upright. `place` is unused here. */
export function digitSvg(digit: number, _place = 0, options: SvgOptions = {}): string {
  return render(
    [{ strokes: digitStrokes(digit), x: 0 }],
    CELL_WIDTH,
    false,
    undefined,
    options,
    String(digit),
  );
}

function render(
  cells: Cell[],
  width: number,
  negative: boolean,
  dot: number | undefined,
  options: SvgOptions,
  defaultTitle: string,
): string {
  const { size = 100, color = 'currentColor', background, strokeWidth = 5, padding = 20 } = options;
  if (!(size > 0)) throw new RangeError(`size must be positive, got ${size}`);
  if (!(strokeWidth > 0)) throw new RangeError(`strokeWidth must be positive, got ${strokeWidth}`);
  const title = options.title ?? defaultTitle;

  const box = {
    x: -padding,
    y: -padding,
    width: width + 2 * padding,
    height: CELL_HEIGHT + 2 * padding,
  };
  const paint = resolvePaint(color, box, 'suzhou-color');
  const fill =
    background === undefined ? undefined : resolvePaint(background, box, 'suzhou-background');
  const defs = [...new Set([fill?.def, paint.def].filter(Boolean))].join('');
  const p = escape(paint.value);

  const d: string[] = [];
  const circles: string[] = [];
  const cy = CELL_HEIGHT / 2;
  for (const cell of cells) {
    const cx = cell.x + CELL_WIDTH / 2;
    for (const s of cell.strokes) {
      if (s.kind === 'line')
        d.push(`M${num(cx + s.x1)} ${num(cy + s.y1)}L${num(cx + s.x2)} ${num(cy + s.y2)}`);
      else circles.push(`<circle cx="${num(cx + s.cx)}" cy="${num(cy + s.cy)}" r="${num(s.r)}"/>`);
    }
  }
  if (negative) {
    const last = cells.at(-1)!;
    d.push(`M${num(last.x - 4)} ${CELL_HEIGHT + 4}L${num(last.x + CELL_WIDTH + 4)} -4`);
  }

  const pixelWidth = (size * box.width) / box.height;
  const label = title === false ? 'aria-hidden="true"' : `role="img" aria-label="${escape(title)}"`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[box.x, box.y, box.width, box.height].map(num).join(' ')}" width="${num(pixelWidth)}" height="${num(size)}" ${label}>`,
    title === false ? '' : `<title>${escape(title)}</title>`,
    defs ? `<defs>${defs}</defs>` : '',
    fill === undefined
      ? ''
      : `<rect x="${num(box.x)}" y="${num(box.y)}" width="${num(box.width)}" height="${num(box.height)}" fill="${escape(fill.value)}"/>`,
    `<g fill="none" stroke="${p}" stroke-width="${num(strokeWidth)}" stroke-linecap="round" stroke-linejoin="round">`,
    d.length ? `<path d="${d.join('')}"/>` : '',
    circles.join(''),
    '</g>',
    dot === undefined
      ? ''
      : `<circle cx="${num(dot)}" cy="${CELL_HEIGHT}" r="${num(strokeWidth)}" fill="${p}"/>`,
    '</svg>',
  ].join('');
}
