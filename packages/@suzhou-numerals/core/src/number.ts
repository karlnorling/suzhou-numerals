import { BASE } from './glyph.js';
import { formatInBase, parseInBase, type NumberInput, type ParsedNumber } from './parse.js';

/** Splits a number into its decimal digits, one per place. */
export function parse(value: NumberInput): ParsedNumber {
  return parseInBase(value, BASE);
}

/** Writes parsed digits back as a canonical decimal string, e.g. `-12.5`. */
export function format(number: ParsedNumber): string {
  return formatInBase(number, BASE);
}
