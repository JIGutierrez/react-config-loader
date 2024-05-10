import {
  DefinedInitialDataOptions,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import type { ConfigDef, ConfigOptions, ConfigUpdater } from './types';
import React from 'react';
import { createConfigFromDefinition } from './createConfigFromDefinition';

const ConfigProvider = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const defaultOptions: ConfigOptions = {
  staleTime: 1000 * 60 * 60 * 24,
  gcTime: 1000 * 60 * 60 * 24 * 2,
  refetchOnMount: false,
};

export function setupConfig<T extends object>(
  initialConfig: ConfigDef<T>,
  updater: ConfigUpdater<T>,
  options?: ConfigOptions
) {
  const queryClient = new QueryClient();
  const provider = ConfigProvider(queryClient);

  const hook = useConfigCreator<T>(
    createConfigFromDefinition(initialConfig),
    updater,
    Object.assign({}, defaultOptions, options)
  );

  return [provider, hook] as const;
}

function useConfigCreator<T extends object>(
  initialConfig: T,
  updater: () => Promise<T>,
  options: ConfigOptions
) {
  return () => {
    const totalOptions: DefinedInitialDataOptions<T> = Object.assign(options, {
      queryFn: updater,
      queryKey: ['config'],
      initialData: initialConfig,
    });
    const hook = useQuery(totalOptions);
    return { ...hook, config: hook.data };
  };
}
