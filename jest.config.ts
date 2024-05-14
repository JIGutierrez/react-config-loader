import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: './src',
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
};

export default config;
