import { QueryObserverOptions } from '@tanstack/react-query';

export type ConfigDef<T extends object> = {
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

/**
 * Function that updates the config.
 * @returns A promise that resolves to the new config.
 * @typeParam T - The type of the config.
 */
export type ConfigUpdater<T> = () => Promise<T>;

/**
 * Options for the react-query QueryClient
 * @see https://react-query.tanstack.com/reference/QueryClient#defaultoptions
 */
export type ConfigOptions = Omit<QueryObserverOptions, 'queryKey' | 'queryFn' | 'initialData'>;
