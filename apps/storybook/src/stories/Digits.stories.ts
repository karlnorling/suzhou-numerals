import { BASE, digitSvg } from '@suzhou-numerals/core';
import type { Meta, StoryObj } from '@storybook/html-vite';

interface Args {
  place: number;
  size: number;
}

const meta = {
  title: 'Suzhou Numerals/Digits',
  render: ({ place, size }) => {
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(${Math.max(size, 48) + 16}px,1fr));gap:12px;align-items:end;width:min(90vw,960px);color:#24292f;font:12px ui-monospace,monospace`;
    for (let digit = 0; digit < BASE; digit++) {
      const cell = document.createElement('figure');
      cell.style.cssText = 'margin:0;display:grid;justify-items:center;gap:4px';
      cell.innerHTML = digitSvg(digit, place, { size }) + `<figcaption>${digit}</figcaption>`;
      grid.append(cell);
    }
    return grid;
  },
  args: { place: 0, size: 56 },
  argTypes: {
    place: {
      control: { type: 'number', min: -4, max: 6, step: 1 },
      description: 'The place value. It makes no difference to a Suzhou digit.',
    },
    size: { control: { type: 'range', min: 24, max: 160, step: 4 } },
  },
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Every digit from 0 to 9.' } },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const AllDigits: Story = {};
