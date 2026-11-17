import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { toImage } from '../src/index.js';

describe('toImage', () => {
  it.each([
    ['png', 'png'],
    ['jpeg', 'jpeg'],
    ['jpg', 'jpeg'],
    ['webp', 'webp'],
  ] as const)('renders %s', async (format, expected) => {
    const image = await toImage(1993, { format, size: 200 });
    const meta = await sharp(image).metadata();
    expect(meta.format).toBe(expected);
    expect(meta.height).toBe(200);
  });

  it('gives JPEG a white background and keeps PNG transparent', async () => {
    const corner = async (format: 'png' | 'jpeg') => {
      const { data, info } = await sharp(await toImage(1, { format }))
        .raw()
        .toBuffer({ resolveWithObject: true });
      return [...data.subarray(0, info.channels)];
    };
    expect(await corner('jpeg')).toEqual([255, 255, 255]);
    expect((await corner('png'))[3]).toBe(0);
  });

  it('draws in black by default', async () => {
    const { data, info } = await sharp(await toImage(8, { format: 'png', size: 200 }))
      .raw()
      .toBuffer({ resolveWithObject: true });
    const opaque: number[][] = [];
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 255) opaque.push([data[i - 3]!, data[i - 2]!, data[i - 1]!]);
    }
    expect(opaque.length).toBeGreaterThan(info.width * 2);
    expect(new Set(opaque.map(String))).toEqual(new Set(['0,0,0']));
  });
});
