// Renders the README images into examples/. Run with: yarn examples
import { mkdir, writeFile } from 'node:fs/promises';
import { BASE, digitSvg, toSvg } from '../packages/@suzhou-numerals/core/dist/index.js';

const out = new URL('../examples/', import.meta.url);
await mkdir(out, { recursive: true });

const style = { size: 120, color: '#24292f', background: '#ffffff' };
const examples = {
  1993: '1993',
  21: '21',
  price: '40.22',
  negative: '-42',
};
for (const [name, value] of Object.entries(examples)) {
  await writeFile(new URL(`${name}.svg`, out), toSvg(value, style));
}

await writeFile(
  new URL('rainbow.svg', out),
  toSvg('1234567', {
    size: 120,
    color:
      'linear-gradient(to right, #e03131, #f76707, #fab005, #40c057, #228be6, #7048e8, #be4bdb)',
  }),
);
await writeFile(
  new URL('christmas.svg', out),
  toSvg('2026.1225', {
    size: 120,
    color: 'repeating-linear-gradient(135deg, #e03131 0 3%, #ffffff 3% 6%)',
    background: 'radial-gradient(#2b8a3e, #0b3d20)',
  }),
);

// Every digit, in rows of ten.
const cell = 80;
const perRow = 10;
const cells = Array.from({ length: BASE }, (_, digit) => {
  const svg = digitSvg(digit, 0, { size: 56, color: '#24292f', title: false });
  const x = (digit % perRow) * cell;
  const y = Math.floor(digit / perRow) * cell;
  return `<g transform="translate(${x} ${y})"><svg width="${cell}" height="${cell - 16}" viewBox="${/viewBox="([^"]+)"/.exec(svg)[1]}">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><text x="${cell / 2}" y="${cell - 2}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="#57606a">${digit}</text></g>`;
});
const width = perRow * cell;
const height = Math.ceil(BASE / perRow) * cell;
await writeFile(
  new URL('digits.svg', out),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="The digits 0 to ${BASE - 1}"><rect width="${width}" height="${height}" fill="#ffffff"/>${cells.join('')}</svg>`,
);
console.log('Wrote examples/');
