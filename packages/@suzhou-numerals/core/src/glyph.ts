/** Suzhou numerals are decimal: each place holds a digit from 0 to 9. */
export const BASE = 10;

/** One digit fills a cell this wide and tall, in viewBox units, centred on the origin. */
export const CELL_WIDTH = 44;
export const CELL_HEIGHT = 60;

/** A stroke from one point to another, or a circle. Coordinates are centred on the cell. */
export type Stroke =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'circle'; cx: number; cy: number; r: number };

const TOP = -CELL_HEIGHT / 2 + 2;
const BOTTOM = CELL_HEIGHT / 2 - 2;

const line = (x1: number, y1: number, x2: number, y2: number): Stroke => ({
  kind: 'line',
  x1,
  y1,
  x2,
  y2,
});

/** One, two or three bars, upright (〡〢〣) or flat (一二三). */
function bars(count: number, flat: boolean, top = TOP, bottom = BOTTOM): Stroke[] {
  const spacing = 14;
  const offsets = Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * spacing);
  if (!flat) return offsets.map((x) => line(x, top, x, bottom));
  const mid = (top + bottom) / 2;
  return offsets.map((y) => line(-18, mid + y, 18, mid + y));
}

/**
 * The strokes for one digit from 0 to 9, in a cell `CELL_WIDTH` × `CELL_HEIGHT` centred on
 * (0, 0).
 *
 * 0 is 〇, 1 to 3 are bars and 4 is a cross (〤). 5 to 9 are 0 to 4 with an upright bar on top:
 * a circle (〥), one to three flat bars (〦〧〨) or the cross (〩). `flat` turns 1, 2 and 3 on
 * their side, the form writers switch to when two of them sit next to each other.
 */
export function digitStrokes(digit: number, flat = false): Stroke[] {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
    throw new RangeError(`A Suzhou digit runs from 0 to 9, got ${digit}`);
  }
  switch (digit) {
    case 0:
      return [{ kind: 'circle', cx: 0, cy: 0, r: 15 }];
    case 1:
    case 2:
    case 3:
      return bars(digit, flat);
    case 4:
      return [line(-15, TOP + 4, 15, BOTTOM - 4), line(15, TOP + 4, -15, BOTTOM - 4)];
    case 5:
      return [line(0, TOP, 0, 2), { kind: 'circle', cx: 0, cy: 15, r: 13 }];
    case 6:
    case 7:
    case 8: {
      const below = bars(digit - 5, true, 2, BOTTOM);
      const first = below[0]!;
      return [line(0, TOP, 0, first.kind === 'line' ? first.y1 : 0), ...below];
    }
    default:
      return [line(0, TOP, 0, 14), line(-14, 2, 14, BOTTOM), line(14, 2, -14, BOTTOM)];
  }
}

/**
 * Which digits to write flat. In a run of neighbouring 1s, 2s and 3s every second one turns
 * on its side, so 21 reads 〢一 and can't be mistaken for 〣.
 */
export function flatDigits(digits: readonly number[]): boolean[] {
  let run = 0;
  return digits.map((digit) => {
    if (digit < 1 || digit > 3) {
      run = 0;
      return false;
    }
    run++;
    return run % 2 === 0;
  });
}
