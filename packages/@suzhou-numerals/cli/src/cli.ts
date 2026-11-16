import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { parseArgs } from 'node:util';
import type { RasterFormat } from '@suzhou-numerals/raster';
import { toSvg, type SvgOptions } from '@suzhou-numerals/core';

const HELP = `Usage: suzhou <number> [options]

Draws a number as Suzhou numerals. Prints SVG to stdout unless --output is given.

Options:
  -o, --output <file>      Write to a .svg, .png, .jpg, .jpeg or .webp file
  -s, --size <px>          Image height in pixels (default 100)
  -c, --color <color>      Colour or CSS gradient (default currentColor for SVG,
                           black for images)
  -b, --background <color> Background colour or CSS gradient (default transparent,
                           white for JPEG)
  -g, --gap <n>            Space between digits in viewBox units (default 12)
      --no-alternate       Keep neighbouring 1s, 2s and 3s upright
  -q, --quality <1-100>    JPEG and WebP quality
  -h, --help               Show this help
  -v, --version            Show the version

Examples:
  suzhou 1993 > 1993.svg
  suzhou 40.22 -o price.webp --size 200
  suzhou -42 -o minus.png
  suzhou 1993 -o 1993.png -c 'linear-gradient(to right, red, blue)'`;

const FORMATS: Record<string, RasterFormat | 'svg'> = {
  '.svg': 'svg',
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp',
};

export interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const defaultIo: Io = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** Runs the CLI and returns the exit code. */
export async function run(argv: string[], io: Io = defaultIo): Promise<number> {
  // parseArgs would read "-42" as an option, so negative numbers are pulled out first.
  const isNegativeNumber = (arg: string) => /^-(\d|\.\d)/.test(arg);
  const numbers = argv.filter(isNegativeNumber);

  let parsed;
  try {
    parsed = parseArgs({
      args: argv.filter((arg) => !isNegativeNumber(arg)),
      allowPositionals: true,
      options: {
        output: { type: 'string', short: 'o' },
        size: { type: 'string', short: 's' },
        color: { type: 'string', short: 'c' },
        background: { type: 'string', short: 'b' },
        gap: { type: 'string', short: 'g' },
        'no-alternate': { type: 'boolean' },
        quality: { type: 'string', short: 'q' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (error) {
    io.stderr(`${(error as Error).message}\n\n${HELP}\n`);
    return 2;
  }

  const { values, positionals } = parsed;
  if (values.help) {
    io.stdout(`${HELP}\n`);
    return 0;
  }
  if (values.version) {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    io.stdout(`${pkg.version}\n`);
    return 0;
  }

  const inputs = [...numbers, ...positionals];
  if (inputs.length !== 1) {
    io.stderr(`Expected exactly one number, got ${inputs.length}.\n\n${HELP}\n`);
    return 2;
  }
  const [input = ''] = inputs;

  try {
    const options: SvgOptions = {
      size: optionalNumber(values.size, '--size'),
      color: values.color,
      background: values.background,
      gap: optionalNumber(values.gap, '--gap'),
      alternate: values['no-alternate'] ? false : undefined,
    };
    const quality = optionalNumber(values.quality, '--quality');

    if (values.output === undefined) {
      io.stdout(`${toSvg(input, options)}\n`);
      return 0;
    }

    const format = FORMATS[extname(values.output).toLowerCase()];
    if (!format) {
      io.stderr(
        `Can't tell the format from "${values.output}". Use .svg, .png, .jpg, .jpeg or .webp.\n`,
      );
      return 2;
    }
    if (format === 'svg') {
      await writeFile(values.output, toSvg(input, options));
    } else {
      // Loaded only for images, so SVG output never loads sharp's native binary.
      const { toImage } = await import('@suzhou-numerals/raster');
      await writeFile(values.output, await toImage(input, { ...options, format, quality }));
    }
    return 0;
  } catch (error) {
    io.stderr(`${(error as Error).message}\n`);
    return 1;
  }
}

function optionalNumber(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${name} must be a number, got "${value}"`);
  return number;
}
