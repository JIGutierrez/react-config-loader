import React, { useEffect } from 'react';
import { setupConfig } from '../setupConfig';
import type { ConfigDef } from '../types';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import axios from 'axios';
import { QueryClient, useIsRestoring } from '@tanstack/react-query';

axios.defaults.adapter = 'http';

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

const staticUpdater = async () => initialConfig;

const numUpdater = async () => ({ ...initialConfig, num: initialConfig.num + 1 });

const webUpdater = async () => {
  return axios.get(new URL('/config', window.location.href).toString()).then(async (res) => {
    return res.data as Promise<ConfigExample>;
  });
};

const createWrapper =
  (Provider: ReturnType<typeof setupConfig<ConfigExample>>[0]) =>
  ({ children }: { children: React.ReactNode }) => {
    return <Provider>{children}</Provider>;
  };

function createConsumer(useConfig: ReturnType<typeof setupConfig<ConfigExample>>[1]) {
  return () => {
    const { config } = useConfig();
    return (
      <div>
        <div data-testid="num">{config.num}</div>
      </div>
    );
  };
}

let client: QueryClient | null = null;
function setup(updater: () => Promise<ConfigExample>) {
  const [a, b, c] = setupConfig(initialConfigDef, updater, { gcTime: Infinity, retry: false });
  client = c;
  return [createWrapper(a), b, c] as const;
}

afterEach(() => {
  client?.clear();
  localStorage.clear();
  client = null;
});

describe('setupConfig', () => {
  it('should initially return initial Config', async () => {
    const [wrapper, hook] = setup(staticUpdater);
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => expect(result.current.config).toEqual(initialConfig));
  });
  it('should update when refetched', async () => {
    const exampleReturn = {
      API_URL: 'https://localhost:8080',
      num: -1,
    };
    nock(window.location.href).get('/config').reply(200, exampleReturn);

    const [wrapper, hook] = setup(webUpdater);
    const { result } = renderHook(hook, { wrapper });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isFetchedAfterMount).toBe(true), { timeout: 3000 });
    expect(result.current.config).toEqual(exampleReturn);
  });
});

describe('Config persistence', () => {
  it('should save to localStorage', async () => {
    const [wrapper, hook] = setup(numUpdater);

    const { result } = renderHook(hook, { wrapper });
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.config.num).toEqual(1));
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem('REACT_QUERY_OFFLINE_CACHE') || '').clientState.queries
      ).toHaveLength(1)
    );
    const data = JSON.parse(localStorage.getItem('REACT_QUERY_OFFLINE_CACHE') || '');
    expect(data.clientState.queries[0].state.data).toEqual({ ...initialConfig, num: 1 });
  });

  it('should restore from localStorage', async () => {
    localStorage.setItem(
      'REACT_QUERY_OFFLINE_CACHE',
      '{"buster":"","timestamp":1715652068434,"clientState":{"mutations":[],"queries":[{"state":{"data":{"API_URL":"https://api.example.com","num":1},"dataUpdateCount":2,"dataUpdatedAt":1715652068434,"error":null,"errorUpdateCount":0,"errorUpdatedAt":0,"fetchFailureCount":0,"fetchFailureReason":null,"fetchMeta":null,"isInvalidated":false,"status":"success","fetchStatus":"idle"},"queryKey":["config"],"queryHash":"[\\"config\\"]"}]}}'
    );

    const [wrapper, hook] = setup(staticUpdater);

    const { result: isRestoring } = renderHook(useIsRestoring, { wrapper });

    await waitFor(() => expect(isRestoring.current).toEqual(false));

    const { result } = renderHook(hook, { wrapper });
    await waitFor(() => expect(result.current.config.num).toEqual(1));
  });
});
