import { QueryObserverOptions } from '@tanstack/react-query';
import { Persister } from '@tanstack/react-query-persist-client';

export type ConfigDef<T> = Partial<T>;

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
export type ConfigQueryOptions = Omit<QueryObserverOptions, 'queryKey' | 'queryFn' | 'initialData'>;

export type SetupConfigOptions<T extends object> = {
  queryOptions?: ConfigQueryOptions;
  buster?: string;
  persister?: Persister;
};
