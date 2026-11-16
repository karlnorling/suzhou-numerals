/** A colour stop. `offset` runs from 0 to 1; leave it out to space stops evenly. */
export interface GradientStop {
  color: string;
  offset?: number;
}

/** A gradient across the whole image, for `color` or `background`. */
export interface Gradient {
  /** Default `linear`. */
  type?: 'linear' | 'radial';
  /** At least one stop. Plain strings are spaced evenly. */
  stops: ReadonlyArray<string | GradientStop>;
  /**
   * Direction of a linear gradient in degrees, as in CSS: 0 runs bottom to top, 90 left to
   * right and the default, 180, top to bottom.
   */
  angle?: number;
  /**
   * Repeat the stops, like CSS `repeating-linear-gradient()`: the pattern from the first stop
   * to the last one repeats across the image. Use it for stripes.
   */
  repeat?: boolean;
}

/** A colour, a CSS gradient string such as `linear-gradient(90deg, red, blue)`, or a gradient. */
export type Paint = string | Gradient;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A resolved paint: the value for a `fill` or `stroke` attribute and any `<defs>` it needs. */
export interface ResolvedPaint {
  value: string;
  def: string;
}

const GRADIENT = /^\s*(repeating-)?(linear|radial)-gradient\(([\s\S]*)\)\s*$/i;

/**
 * Turns a CSS `linear-gradient()`, `radial-gradient()` or their `repeating-` forms into a
 * {@link Gradient}. Stop positions are percentages, and a stop can have two
 * (`red 10% 20%`) to make a hard-edged band.
 */
export function parseGradient(css: string): Gradient | undefined {
  const match = GRADIENT.exec(css);
  if (!match) return undefined;
  const repeat = match[1] !== undefined;
  const type = match[2]!.toLowerCase() as 'linear' | 'radial';
  const parts = splitTopLevel(match[3]!);
  let angle: number | undefined;
  if (type === 'linear' && parts.length > 0) {
    angle = parseDirection(parts[0]!);
    if (angle !== undefined) parts.shift();
  } else if (
    type === 'radial' &&
    parts.length > 0 &&
    /^(circle|ellipse|closest|farthest|at)\b/i.test(parts[0]!)
  ) {
    // Shape and position are accepted but always drawn as a circle from the centre.
    parts.shift();
  }
  if (parts.length === 0) throw new SyntaxError(`A gradient needs at least one colour: ${css}`);
  const stops = parts.flatMap((part): GradientStop[] => {
    const stop = /^([\s\S]*?\S)\s+(-?[\d.]+%|0)(?:\s+(-?[\d.]+%|0))?$/.exec(part);
    if (!stop) return [{ color: part }];
    const color = stop[1]!;
    const offsets = [stop[2]!, stop[3]].filter((o) => o !== undefined);
    return offsets.map((o) => ({ color, offset: Number.parseFloat(o) / 100 }));
  });
  return {
    type,
    stops,
    ...(angle === undefined ? {} : { angle }),
    ...(repeat ? { repeat } : {}),
  };
}

/**
 * Resolves a paint to an attribute value. Gradients become a `<linearGradient>` or
 * `<radialGradient>` in user space over `box`, so they span the whole image the same way
 * whether they paint one stroke or the background. The id is a hash of the definition, so
 * two inline SVGs only share an id when they share the gradient too.
 */
export function resolvePaint(paint: Paint, box: Box, prefix: string): ResolvedPaint {
  const gradient = typeof paint === 'string' ? parseGradient(paint) : paint;
  if (gradient === undefined) return { value: paint as string, def: '' };
  if (gradient.stops.length === 0) throw new RangeError('A gradient needs at least one stop');

  let spaced = spaceStops(gradient.stops);
  // A repeating gradient draws one period, from the first stop to the last, and lets
  // spreadMethod="repeat" tile it along the line.
  let [from, to] = [0, 1];
  if (gradient.repeat) {
    from = spaced[0]!.offset;
    to = spaced.at(-1)!.offset;
    if (!(to > from))
      throw new RangeError('A repeating gradient needs stops that span some distance');
    spaced = spaced.map((s) => ({ ...s, offset: (s.offset - from) / (to - from) }));
  }
  const spread = gradient.repeat ? ' spreadMethod="repeat"' : '';
  // Built on use, since a radial gradient adjusts the offsets first.
  const stops = () =>
    spaced
      .map(
        ({ color, offset }) => `<stop offset="${num(offset)}" stop-color="${escapeAttr(color)}"/>`,
      )
      .join('');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  let body: string;
  if ((gradient.type ?? 'linear') === 'radial') {
    // A repeating radial pattern starts at the centre, so only the last stop sets its size.
    const r = (Math.hypot(box.width, box.height) / 2) * (gradient.repeat ? to : 1);
    if (gradient.repeat && from !== 0) {
      spaced = spaced.map((s) => ({ ...s, offset: from / to + s.offset * (1 - from / to) }));
    }
    body = `radialGradient gradientUnits="userSpaceOnUse"${spread} cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}">${stops()}</radialGradient>`;
  } else {
    // The CSS gradient line: through the centre, long enough that the corners get the end colours.
    const radians = ((gradient.angle ?? 180) * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = -Math.cos(radians);
    const half = (Math.abs(box.width * dx) + Math.abs(box.height * dy)) / 2;
    const at = (t: number) => [cx + dx * half * (2 * t - 1), cy + dy * half * (2 * t - 1)] as const;
    const [x1, y1] = at(from);
    const [x2, y2] = at(to);
    body = `linearGradient gradientUnits="userSpaceOnUse"${spread} x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}">${stops()}</linearGradient>`;
  }
  const id = `${prefix}-${hash(body)}`;
  return { value: `url(#${id})`, def: `<${body.replace(' ', ` id="${id}" `)}` };
}

/** Fills in missing offsets the way CSS does: ends at 0 and 1, gaps spread evenly, never backwards. */
function spaceStops(input: ReadonlyArray<string | GradientStop>): Required<GradientStop>[] {
  const stops = input.map((s) => (typeof s === 'string' ? { color: s } : { ...s }));
  if (stops[0]!.offset === undefined) stops[0]!.offset = 0;
  if (stops.at(-1)!.offset === undefined) stops.at(-1)!.offset = stops.length === 1 ? 0 : 1;
  let max = 0;
  for (const stop of stops) {
    if (stop.offset !== undefined) stop.offset = max = Math.max(max, stop.offset);
  }
  for (let i = 1; i < stops.length; i++) {
    if (stops[i]!.offset !== undefined) continue;
    let j = i;
    while (stops[j]!.offset === undefined) j++;
    const from = stops[i - 1]!.offset!;
    const step = (stops[j]!.offset! - from) / (j - i + 1);
    for (let k = i; k < j; k++) stops[k]!.offset = from + step * (k - i + 1);
  }
  return stops as Required<GradientStop>[];
}

const SIDES: Record<string, [number, number]> = {
  top: [0, -1],
  bottom: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function parseDirection(part: string): number | undefined {
  const angle = /^(-?[\d.]+)(deg|turn|rad|grad)$/i.exec(part);
  if (angle) {
    const value = Number(angle[1]);
    const unit = angle[2]!.toLowerCase();
    if (unit === 'turn') return value * 360;
    if (unit === 'rad') return (value * 180) / Math.PI;
    if (unit === 'grad') return value * 0.9;
    return value;
  }
  const to = /^to\s+(top|bottom|left|right)(?:\s+(top|bottom|left|right))?$/i.exec(part);
  if (!to) return undefined;
  const [x1, y1] = SIDES[to[1]!.toLowerCase()]!;
  const [x2, y2] = to[2] ? SIDES[to[2].toLowerCase()]! : [0, 0];
  // Corners point along the diagonal of a square; close to CSS for the tall images drawn here.
  return (Math.atan2(x1 + x2, -(y1 + y2)) * 180) / Math.PI;
}

/** Splits on commas that aren't inside parentheses, so `rgb(1, 2, 3)` stays whole. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** FNV-1a, as a short base-36 string. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

export function num(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export function escapeAttr(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
