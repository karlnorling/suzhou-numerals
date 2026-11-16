# @suzhou-numerals/cli

Draw any number as [Suzhou numerals](https://en.wikipedia.org/wiki/Suzhou_numerals) from the command line: SVG, PNG, JPEG or WebP.

```sh
npx @suzhou-numerals/cli 1993 > 1993.svg
npx @suzhou-numerals/cli 40.22 -o price.webp --size 200
npx @suzhou-numerals/cli -42 -o minus.png
```

Installed globally with `npm install -g @suzhou-numerals/cli`, the command is `suzhou`.

```
Usage: suzhou <number> [options]

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
  suzhou 1993 -o 1993.png -c 'linear-gradient(to right, red, blue)'
```

## License

MIT
