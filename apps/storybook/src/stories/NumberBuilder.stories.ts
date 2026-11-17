import { toSvg, type SvgOptions } from '@suzhou-numerals/core';
import type { Meta, StoryObj } from '@storybook/html-vite';

type Args = Omit<SvgOptions, 'title' | 'color' | 'background'> & {
  value: string;
  title: string;
  color: string;
  background: string;
};

/** Renders the args, or the parse error in place of the image. */
function render({ value, title, color, background, ...options }: Args): HTMLElement {
  const root = document.createElement('div');
  root.style.color = '#24292f';
  try {
    // Empty text controls fall back to the defaults: currentColor and no background.
    root.innerHTML = toSvg(value, {
      ...options,
      ...(color ? { color } : {}),
      ...(background ? { background } : {}),
      ...(title ? { title } : {}),
    });
  } catch (error) {
    root.setAttribute('role', 'alert');
    root.style.color = '#c92a2a';
    root.style.fontFamily = 'system-ui, sans-serif';
    root.textContent = (error as Error).message;
  }
  return root;
}

const meta = {
  title: 'Suzhou Numerals/Number Builder',
  render,
  args: {
    value: '1993',
    size: 160,
    gap: 12,
    padding: 20,
    alternate: true,
    color: '',
    background: '',
    title: '',
  },
  argTypes: {
    value: {
      control: 'text',
      description:
        'Any decimal number: whole, fractional, negative or very large. Passed as a string so every digit is kept.',
    },
    size: {
      control: { type: 'range', min: 24, max: 480, step: 4 },
      description: 'Image height in pixels.',
    },
    gap: { control: { type: 'range', min: 0, max: 80, step: 2 } },
    padding: { control: { type: 'range', min: 0, max: 40, step: 1 } },
    alternate: {
      control: 'boolean',
      description:
        'Turns every second 1, 2 or 3 in a run on its side, so 21 is \u3022\u4e00 rather than \u3022\u3021, which reads like \u3023.',
    },
    color: {
      control: 'text',
      description:
        'A CSS colour, or a gradient: `linear-gradient(to right, red, blue)`, `radial-gradient(…)` or their `repeating-` forms. Empty for currentColor.',
    },
    background: {
      control: 'text',
      description: 'A colour or a gradient, as for **color**. Empty for transparent.',
    },
    title: { control: 'text', description: 'Accessible name. Leave empty to use the number.' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Type any number in the **value** control and adjust the style. Every control maps to a `toSvg` option.',
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};

export const NeighbouringOnes: Story = {
  args: { value: '1123' },
  parameters: {
    docs: { description: { story: 'Every second 1, 2 or 3 in a run is written flat.' } },
  },
};

export const AllUpright: Story = {
  args: { value: '1123', alternate: false },
  parameters: { docs: { description: { story: 'Without the rule, the bars run together.' } } },
};

export const Price: Story = {
  args: { value: '40.22' },
  parameters: { docs: { description: { story: 'A dot marks the decimal point.' } } },
};

export const Negative: Story = {
  args: { value: '-42' },
  parameters: { docs: { description: { story: 'A diagonal stroke across the last digit.' } } },
};

export const Rainbow: Story = {
  args: {
    value: '1234567',
    color:
      'linear-gradient(to right, #e03131, #f76707, #fab005, #40c057, #228be6, #7048e8, #be4bdb)',
  },
};

export const Christmas: Story = {
  args: {
    value: '2026.1225',
    color: 'repeating-linear-gradient(135deg, #e03131 0 3%, #ffffff 3% 6%)',
    background: 'radial-gradient(#2b8a3e, #0b3d20)',
  },
};

export const InvalidInput: Story = {
  args: { value: 'twelve' },
  parameters: {
    docs: { description: { story: "Input that isn't a decimal number shows the error." } },
  },
};
