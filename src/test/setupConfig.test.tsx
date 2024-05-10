import React, { useEffect } from 'react';
import { setupConfig } from '../setupConfig';
import { ConfigDef } from '../types';
import { render, renderHook, waitFor } from '@testing-library/react';

interface ConfigExample {
  API_URL: string;
  API_PORT?: number;
  num: number;
}

export const initialConfig: ConfigExample = {
  API_URL: 'https://api.example.com',
  num: 0,
};

const initialConfigDef: ConfigDef<ConfigExample> = {
  API_URL: {
    initialValue: 'https://api.example.com',
  },
  num: {
    initialValue: 0,
  },
};

const newUpdater = () => {
  let num = 0;
  return async () => {
    const result = {
      ...initialConfig,
      num,
    };
    num += 1;
    return result;
  };
};

const wrapper =
  (Provider: ReturnType<typeof setupConfig<ConfigExample>>[0]) =>
  ({ children }: { children: React.ReactNode }) => {
    return <Provider>{children}</Provider>;
  };

function createConsumer(useConfig: ReturnType<typeof setupConfig<ConfigExample>>[1]) {
  return () => {
    const { config, refetch } = useConfig();
    useEffect(() => {
      refetch();
    }, []);
    return (
      <div>
        <div data-testid="num">{config.num}</div>
      </div>
    );
  };
}
const setup = () => {
  const [a, b] = setupConfig(initialConfigDef, newUpdater());
  return [wrapper(a), b] as const;
};

describe('setupConfig', () => {
  it('should initially return initial Config', async () => {
    const [wrapper, hook] = setup();
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => {
      expect(result.current.config).toEqual(initialConfig);
    });
  });
  it('should update the config when the updater is called', async () => {
    const [wrapper, hook] = setup();
    const Consumer = createConsumer(hook);
    let { getByTestId } = render(<Consumer />, { wrapper });
    waitFor(() => expect(getByTestId('num').textContent).toBe('1'));
  });
});
