import { toSvg, type NumberInput, type SvgOptions } from '@suzhou-numerals/core';

export type RasterFormat = 'png' | 'jpeg' | 'jpg' | 'webp';

export interface RasterOptions extends SvgOptions {
  /** Default `png`. */
  format?: RasterFormat;
  /** JPEG and WebP quality from 1 to 100. Uses sharp's default when left out. */
  quality?: number;
}

/**
 * Renders a number as a PNG, JPEG or WebP image of Suzhou numerals.
 *
 * Rasterises with sharp. The colour defaults to black, and JPEG,
 * which has no transparency, gets a white background unless you pass one.
 */
export async function toImage(value: NumberInput, options: RasterOptions = {}): Promise<Buffer> {
  const { format = 'png', quality, ...svgOptions } = options;
  const sharp = await loadSharp();
  const isJpeg = format === 'jpeg' || format === 'jpg';
  const svg = toSvg(value, {
    ...svgOptions,
    color: svgOptions.color ?? '#000000',
    background: svgOptions.background ?? (isJpeg ? '#ffffff' : undefined),
  });

  const image = sharp(Buffer.from(svg));
  // Edge pixels can come out partly transparent when the size isn't a whole number of
  // pixels, so JPEG, which has no alpha, is flattened onto white rather than black.
  if (isJpeg) return image.flatten({ background: '#ffffff' }).jpeg({ quality }).toBuffer();
  if (format === 'webp') return image.webp({ quality }).toBuffer();
  if (format === 'png') return image.png().toBuffer();
  throw new TypeError(`Unsupported format: ${String(format)}`);
}

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch (error) {
    throw new Error(
      '@suzhou-numerals/raster could not load sharp. Reinstall it, or see https://sharp.pixelplumbing.com/install',
      {
        cause: error,
      },
    );
  }
}
