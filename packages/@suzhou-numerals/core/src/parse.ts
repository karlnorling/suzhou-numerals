/** Anything that can be written as a plain decimal number. */
export type NumberInput = number | bigint | string;

/** A number as digits in the numeral system's base, most significant first. */
export interface ParsedNumber {
  negative: boolean;
  /** Integer digits. Always holds at least one digit; zero is `[0]`. */
  integer: number[];
  /** Fraction digits after the point. Empty when the number is whole. */
  fraction: number[];
}

const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i;

/** Larger exponents would mean building strings of millions of digits. */
const MAX_EXPONENT = 100_000;

/**
 * Converts a decimal number to digits in `base`, exactly. Every finite decimal fraction is
 * also finite in bases 10, 20 and 60, because 10ⁿ divides them all to the nth power.
 */
export function parseInBase(value: NumberInput, base: number): ParsedNumber {
  const { negative, integer, fraction } = parseDecimal(value);
  return {
    negative,
    integer: integerDigits(BigInt(integer || '0'), base),
    fraction: fractionDigits(fraction, base),
  };
}

/** Writes digits in `base` back as a canonical decimal string, e.g. `-12.5`. */
export function formatInBase({ negative, integer, fraction }: ParsedNumber, base: number): string {
  const b = BigInt(base);
  const whole = integer.reduce((sum, digit) => sum * b + BigInt(digit), 0n);
  // The fraction is numerator / base^length; long division gives its decimal digits.
  let numerator = fraction.reduce((sum, digit) => sum * b + BigInt(digit), 0n);
  const denominator = b ** BigInt(fraction.length);
  let decimals = '';
  for (let i = 0; numerator !== 0n && i < 10_000; i++) {
    numerator *= 10n;
    decimals += String(numerator / denominator);
    numerator %= denominator;
  }
  const zero = whole === 0n && decimals === '';
  return `${negative && !zero ? '-' : ''}${whole}${decimals ? `.${decimals}` : ''}`;
}

interface Decimal {
  negative: boolean;
  /** Digits before the point, without leading zeros. Empty for zero. */
  integer: string;
  /** Digits after the point, without trailing zeros. */
  fraction: string;
}

function parseDecimal(value: NumberInput): Decimal {
  const text = toText(value);
  const match = DECIMAL.exec(text);
  const [, sign = '', rawInteger = '', rawFraction = '', rawExponent] = match ?? [];
  if (!match || (rawInteger === '' && rawFraction === '')) {
    throw new TypeError(`Not a decimal number: ${JSON.stringify(String(value))}`);
  }

  let integer = rawInteger;
  let fraction = rawFraction;
  if (rawExponent !== undefined) {
    const exponent = Number(rawExponent);
    if (Math.abs(exponent) > MAX_EXPONENT) {
      throw new RangeError(`Exponent out of range: ${rawExponent}`);
    }
    [integer, fraction] = shiftPoint(integer, fraction, exponent);
  }

  integer = integer.replace(/^0+/, '');
  fraction = fraction.replace(/0+$/, '');
  return { negative: sign === '-' && (integer !== '' || fraction !== ''), integer, fraction };
}

function toText(value: NumberInput): string {
  switch (typeof value) {
    case 'number':
      if (!Number.isFinite(value)) throw new RangeError(`Not a finite number: ${value}`);
      // Shortest round-trip form, so 0.1 stays "0.1". Very large or small values come
      // back in exponent form, which parseDecimal() expands.
      return String(value);
    case 'bigint':
      return value.toString();
    case 'string':
      return value.trim().replaceAll('_', '');
    default:
      throw new TypeError(`Expected a number, bigint or string, got ${typeof value}`);
  }
}

function shiftPoint(integer: string, fraction: string, exponent: number): [string, string] {
  const digits = integer + fraction;
  const point = integer.length + exponent;
  if (point <= 0) return ['', '0'.repeat(-point) + digits];
  if (point >= digits.length) return [digits + '0'.repeat(point - digits.length), ''];
  return [digits.slice(0, point), digits.slice(point)];
}

function integerDigits(value: bigint, base: number): number[] {
  const b = BigInt(base);
  const digits: number[] = [];
  do {
    digits.unshift(Number(value % b));
    value /= b;
  } while (value > 0n);
  return digits;
}

function fractionDigits(fraction: string, base: number): number[] {
  if (fraction === '') return [];
  const b = BigInt(base);
  const denominator = 10n ** BigInt(fraction.length);
  let numerator = BigInt(fraction);
  const digits: number[] = [];
  // Terminates within fraction.length steps for bases that 10 divides into evenly.
  for (let i = 0; numerator !== 0n; i++) {
    if (i > fraction.length * 4 + 8) {
      throw new RangeError(`${fraction} has no finite expansion in base ${base}`);
    }
    numerator *= b;
    digits.push(Number(numerator / denominator));
    numerator %= denominator;
  }
  return digits;
}
