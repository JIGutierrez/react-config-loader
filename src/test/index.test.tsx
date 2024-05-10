import { createConfig } from '../index';

describe('index', () => {
  it('exports required functions', () => {
    expect(createConfig).toBeDefined();
  });
});
