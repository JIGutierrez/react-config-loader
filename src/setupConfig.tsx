import {
  DefinedInitialDataOptions,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import type { ConfigDef, ConfigOptions, ConfigUpdater } from './types';
import React, { useEffect } from 'react';
import { createConfigFromDefinition } from './createConfigFromDefinition';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const ConfigProvider = (client: QueryClient) => {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
  });

  return ({ children }: { children: React.ReactNode }) => (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister: localStoragePersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

const defaultOptions: ConfigOptions = {
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
  options?: ConfigOptions
) {
  const mergedOptions = { ...defaultOptions, ...options };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: mergedOptions,
    },
  });

  const provider = ConfigProvider(queryClient);

  const hook = useConfigCreator<T>(createConfigFromDefinition(initialConfig), updater);

  return [provider, hook, queryClient] as const;
}

function useConfigCreator<T extends object>(initialConfig: T, updater: ConfigUpdater<T>) {
  return () => {
    const hook = useQuery({ queryFn: updater, queryKey: ['config'], initialData: initialConfig });
    return { ...hook, config: hook.data };
  };
}
