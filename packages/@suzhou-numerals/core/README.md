# @suzhou-numerals/core

Render any number as [Suzhou numerals](https://en.wikipedia.org/wiki/Suzhou_numerals) in SVG. No dependencies; works in Node and the browser.

<img src="https://raw.githubusercontent.com/karlnorling/suzhou-numerals/main/examples/1993.svg" alt="1993" height="80"> <img src="https://raw.githubusercontent.com/karlnorling/suzhou-numerals/main/examples/21.svg" alt="21" height="80"> <img src="https://raw.githubusercontent.com/karlnorling/suzhou-numerals/main/examples/rainbow.svg" alt="1234567 in rainbow colours" height="80">

```sh
npm install @suzhou-numerals/core
```

```js
import { toSvg } from '@suzhou-numerals/core';

document.body.innerHTML = toSvg(1993, { size: 200 });

// Colours and backgrounds take CSS gradients too.
toSvg('1234567', {
  color: 'linear-gradient(to right, #e03131, #f76707, #fab005, #40c057, #228be6, #7048e8, #be4bdb)',
});
```

Neighbouring 1s, 2s and 3s alternate upright and flat, a dot marks the decimal point, and negatives get a diagonal stroke. For PNG, JPEG or WebP, use [`@suzhou-numerals/raster`](https://www.npmjs.com/package/@suzhou-numerals/raster).

See the [docs and playground](https://karlnorling.github.io/suzhou-numerals/) for every option and how numbers are drawn.

## License

MIT
