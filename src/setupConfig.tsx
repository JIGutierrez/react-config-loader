import {
  DefinedInitialDataOptions,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import type { ConfigDef, ConfigQueryOptions, ConfigUpdater, SetupConfigOptions } from './types';
import React from 'react';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider, Persister } from '@tanstack/react-query-persist-client';

const ConfigProvider = (client: QueryClient, persister?: Persister, buster?: string) => {
  const localStoragePersister =
    persister ||
    createSyncStoragePersister({
      storage: window.localStorage,
    });

  return ({ children }: { children: React.ReactNode }) => (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister: localStoragePersister, buster }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

const defaultOptions: ConfigQueryOptions = {
  staleTime: 0,
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnMount: true,
  refetchInterval: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

export function setupConfig<T extends object>(
  initialConfig: ConfigDef<T>,
  updater: ConfigUpdater<T>,
  options?: SetupConfigOptions
) {
  const mergedOptions = { ...defaultOptions, ...options?.queryOptions };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: mergedOptions,
    },
  });

  const provider = ConfigProvider(queryClient, options?.persister, options?.buster);

  const hook = useConfigCreator<T>(initialConfig, updater);

  return [provider, hook, queryClient] as const;
}

function useConfigCreator<T extends object>(initialConfig: Partial<T>, updater: ConfigUpdater<T>) {
  return () => {
    const hook = useQuery({ queryFn: updater, queryKey: ['config'], initialData: initialConfig });
    return { ...hook, config: hook.data };
  };
}
