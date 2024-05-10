import { ConfigDef } from './types';

export function createConfigFromDefinition<T extends object>(initialConfig: ConfigDef<T>) {
  const state: Partial<T> = {};

  let key: keyof T;
  for (key in initialConfig) {
    const config = initialConfig[key as keyof ConfigDef<T>] as ConfigDef<T>[keyof ConfigDef<T>];
    if (config) {
      const initialValue = config.initialValue as T[keyof T];
      state[key] = initialValue;
    }
  }

  return state as T;
}
