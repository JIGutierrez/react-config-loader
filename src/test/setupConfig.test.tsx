import React, { useEffect } from 'react';
import { setupConfig } from '../setupConfig';
import type { ConfigDef, SetupConfigOptions } from '../types';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import axios from 'axios';
import { QueryClient, useIsRestoring } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

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

const storageKey = 'REACT_QUERY_OFFLINE_CACHE';

function testStorageCache<V>(storage: Storage, key: string, value?: V, index: number = 0): void {
  const data: Record<string, V> = JSON.parse(storage.getItem(storageKey) || '')?.clientState
    ?.queries[index]?.state?.data;
  expect(data).toBeDefined();
  expect(data).toHaveProperty(key);
  if (value) {
    expect(data[key]).toEqual(value);
  }
}

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
function setup(updater: () => Promise<ConfigExample>, options?: SetupConfigOptions<ConfigExample>) {
  const [a, b, c] = setupConfig(initialConfigDef, updater, {
    queryOptions: { gcTime: Infinity, retry: false },
    ...options,
  });
  client = c;
  return [createWrapper(a), b, c] as const;
}

afterEach(() => {
  client?.unmount();
  client?.cancelQueries();
  client?.clear();
  client?.removeQueries();
  client = null;
  localStorage.clear();
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

    const [wrapper, hook] = setup(webUpdater, { buster: 'web' });
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
    const [wrapper, hook] = setup(numUpdater, { buster: 'save' });

    const { result } = renderHook(hook, { wrapper });
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.config.num).toEqual(1));
    await waitFor(() => testStorageCache(localStorage, 'num', 1));
  });

  it('should restore from localStorage', async () => {
    localStorage.setItem(
      storageKey,
      `{"buster":"load","timestamp":${Date.now()},"clientState":{"mutations":[],"queries":[{"state":{"data":{"API_URL":"https://api.example.com","num":1},"dataUpdateCount":2,"dataUpdatedAt":${Date.now()},"error":null,"errorUpdateCount":0,"errorUpdatedAt":0,"fetchFailureCount":0,"fetchFailureReason":null,"fetchMeta":null,"isInvalidated":false,"status":"success","fetchStatus":"idle"},"queryKey":["config"],"queryHash":"[\\"config\\"]"}]}}`
    );

    const [wrapper, hook] = setup(staticUpdater, { buster: 'load' });

    const { result: isRestoring } = renderHook(useIsRestoring, { wrapper });

    await waitFor(() => expect(isRestoring.current).toEqual(false));

    const { result } = renderHook(hook, { wrapper });
    await waitFor(() => expect(result.current.config.num).toEqual(1));
  });
});

describe('Custom persisters', () => {
  it('should load sync persister', async () => {
    const storagePersister = createSyncStoragePersister({ storage: sessionStorage });
    const [wrapper, hook] = setup(numUpdater, { buster: 'sync', persister: storagePersister });
    const { result } = renderHook(hook, { wrapper });
    act(() => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.config.num).toEqual(1));
    await waitFor(() => expect(testStorageCache(sessionStorage, 'num', 1)), { timeout: 3000 });
  });
});
