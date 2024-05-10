import { setupConfig } from '../index';

describe('index', () => {
  it('exports required functions', () => {
    expect(setupConfig).toBeDefined();
  });
});
