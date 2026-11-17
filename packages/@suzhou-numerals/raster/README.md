# @suzhou-numerals/raster

Render any number as [Suzhou numerals](https://en.wikipedia.org/wiki/Suzhou_numerals) in PNG, JPEG or WebP, using [sharp](https://sharp.pixelplumbing.com/).

```sh
npm install @suzhou-numerals/raster
```

```js
import { toImage } from '@suzhou-numerals/raster';
import { writeFile } from 'node:fs/promises';

await writeFile('1993.png', await toImage(1993));
await writeFile('pi.webp', await toImage('3.14159', { format: 'webp', size: 400 }));
```

`toImage` takes every option of `toSvg` from [`@suzhou-numerals/core`](https://www.npmjs.com/package/@suzhou-numerals/core), plus `format` (`png`, `jpeg`, `jpg` or `webp`; default `png`) and `quality` (1–100). Colours default to black, and JPEG gets a white background unless you pass one.

See the [docs](https://karlnorling.github.io/suzhou-numerals/packages/raster/).

## License

MIT
