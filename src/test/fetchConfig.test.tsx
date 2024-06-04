import { fetchConfig, fetchJSON } from '../fetchConfig';

const exampleConfig = {
  api_url: 'test_url',
};

const exampleURL = '/config';

describe('Fetch Utils', () => {
  test('fetchConfig should return a response with correct body', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...exampleConfig }),
      })
    ) as jest.Mock;

    const response = await fetchConfig(exampleURL);
    expect(await response.json()).toEqual(exampleConfig);
  });
  test('fetchJSON should correctly parse JSON', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...exampleConfig }),
      })
    ) as jest.Mock;

    const data = await fetchJSON<typeof exampleConfig>(exampleURL);
    expect(data).toEqual(exampleConfig);
  });
});
