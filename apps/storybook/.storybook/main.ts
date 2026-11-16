import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/html-vite',
  viteFinal: (config) => {
    if (process.env.STORYBOOK_BASE_PATH) {
      config.base = process.env.STORYBOOK_BASE_PATH;
    }
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Stories run against source, so editing core shows up without a build.
      '@suzhou-numerals/core': fileURLToPath(
        new URL('../../../packages/@suzhou-numerals/core/src/index.ts', import.meta.url),
      ),
    };
    return config;
  },
};

export default config;
