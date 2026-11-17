import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { run } from '../src/cli.js';

describe('cli', () => {
  let dir: string;
  const io = () => {
    const out = { stdout: '', stderr: '' };
    return {
      out,
      io: {
        stdout: (t: string) => void (out.stdout += t),
        stderr: (t: string) => void (out.stderr += t),
      },
    };
  };

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'suzhou-numerals-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('prints the version from its own package.json', async () => {
    const { out, io: streams } = io();
    expect(await run(['--version'], streams)).toBe(0);
    expect(out.stdout).toMatch(/^\d+\.\d+\.\d+\n$/);
  });

  it('prints SVG to stdout', async () => {
    const { out, io: streams } = io();
    expect(await run(['1993'], streams)).toBe(0);
    expect(out.stdout).toMatch(/^<svg .*<title>1993<\/title>.*<\/svg>\n$/);
  });

  it('accepts negative numbers next to options', async () => {
    const { out, io: streams } = io();
    expect(await run(['-s', '50', '-12.5'], streams)).toBe(0);
    expect(out.stdout).toContain('<title>-12.5</title>');
    expect(out.stdout).toContain('height="50"');
  });

  it('reads --no-alternate', async () => {
    const { out, io: streams } = io();
    expect(await run(['21', '--no-alternate'], streams)).toBe(0);
    expect(out.stdout).toContain('M78 2L78 58');
  });

  it.each(['svg', 'png', 'jpg', 'webp'])('writes a .%s file', async (ext) => {
    const file = join(dir, `out.${ext}`);
    const { io: streams } = io();
    expect(await run(['42', '-o', file, '--size', '64'], streams)).toBe(0);
    const meta = await sharp(await readFile(file)).metadata();
    expect(meta.height).toBe(64);
  });

  it.each([
    [[], 2],
    [['1', '2'], 2],
    [['1', '--nope'], 2],
    [['1', '-o', 'out.gif'], 2],
    [['abc'], 1],
    [['1', '--size', 'big'], 1],
  ])('exits with an error for %j', async (args, code) => {
    const { out, io: streams } = io();
    expect(await run(args, streams)).toBe(code);
    expect(out.stderr).not.toBe('');
  });
});
