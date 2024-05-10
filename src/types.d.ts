import { QueryClientConfig, QueryOptions, UseQueryOptions } from '@tanstack/react-query';
import type { Dispatch } from 'react';

type ConfigDef<T extends object> = {
  [K in RequiredKeys<T>]: RequiredConfigDefinition<T[K]>;
} & {
  [K in Exclude<keyof T, RequiredKeys<T>>]?: OptionalConfigDefinition<T[K]>;
};

export type StoredConfig<T extends object> = {
  [K in RequiredKeys<T>]: T[K];
} & {
  [K in Exclude<keyof T, RequiredKeys<T>>]?: T[K];
};

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface OptionalConfigDefinition<V> {
  initialValue?: V;
  onLoad?: boolean;
}

interface RequiredConfigDefinition<V> extends OptionalConfigDefinition<V> {
  initialValue: V;
}

export type ConfigUpdater<T> = () => Promise<T>;

type ConfigOptions = {
  staleTime?: number;
  refetchOnMount?: boolean;
  retryDelay?: number | ((retryCount: number, error: Error) => number);
  gcTime?: number;
};
