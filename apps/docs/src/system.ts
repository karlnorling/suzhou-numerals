// Settings the docs components share: presets, looks and the options this system adds.
export interface Extra {
  key: string;
  label: string;
  flag: string;
  type: 'select' | 'checkbox';
  options?: { value: string; label: string }[];
  default: string | boolean;
}

export interface Look {
  value: string;
  color?: string;
  background?: string;
}

export const system = {
  name: 'Suzhou numerals',
  base: 10,
  sizeLabel: 'Height',
  sizeDefault: 120,
  gapDefault: 12,
  miniSize: 44,
  chartSize: 56,
  exampleSize: 64,
  randomMax: 99999,
  presets: ['1993', '21', '123', '305', '40.22', '-42', '0', '2026'],
  extras: [
    {
      key: 'alternate',
      label: 'Turn neighbouring 1\u20133s flat',
      flag: '--no-alternate',
      type: 'checkbox',
      default: true,
    },
  ] as Extra[],
  looks: {
    plain: { value: '1993' } as Look,
    rainbow: {
      value: '1234567',
      color:
        'linear-gradient(to right, #e03131, #f76707, #fab005, #40c057, #228be6, #7048e8, #be4bdb)',
    } as Look,
    christmas: {
      value: '2026.1225',
      color: 'repeating-linear-gradient(135deg, #e03131 0 3%, #ffffff 3% 6%)',
      background: 'radial-gradient(#2b8a3e, #0b3d20)',
    } as Look,
  },
};
