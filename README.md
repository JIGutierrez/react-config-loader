# React Config Loader

![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-config-loader)

React Hook for loading client-side configuration or environment variables at runtime. Stores locally and supports custom refresh times and storage.

## Quickstart

```
npm install react-config-loader
```

In some section of your application, define:

```ts
// setupConfig.ts
import { setupConfig, ConfigDef, fetchJSON } from 'react-config-loader';

// It's recommended to do this setup in it's own file for easier importing

// Define your configuration shape, for type safety.
// Javascript users can just define a config without types.

interface Config {
  API_URL: string;
  optionalVariable?: number;
}

// Define default values for all non-optional variables.

const config: ConfigDef<Config> = {
  API_URL: 'https://localhost:3000',
};

// define a method of retrieving and parsing your configuration
// react-config-loader exports helper functions, but you can use your own as long as it satisfies () => Promise<Config>
const updater = fetchJSON('config.json');

const [ConfigProvider, useConfig] = setupConfig(config, updater);

export { ConfigProvider, useConfig };
```

Then, in your `main.tsx` (or the uppermost scope you'd like your config to be available in):

```tsx
// main.tsx
import { ConfigProvider } from './setupConfig.ts';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider>
      <!-- other wrappers -->
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
```

Then, in any child of `ConfigProvider` (in the example above, app-wide):

```tsx
// MyPage.tsx
import { useConfig } from './setupConfig.ts';

export function MyPage() {
  const { config } = useConfig();
  return <span>{config.API_URL}</span>;
}
```

## Context

In CSR applications, we usually have "environment variables" that are bundled into the application at build time. However, when deployed on a cluster, it can be a hassle to rebuild every instance of the application just to update a variable.

### Solution

The general idea is to have a static "file" (i.e, independent from the application build process) that all instances query at regular intervals for the intended values. This is achieved in this application using [`@tanstack/react-query`](https://tanstack.com/query) to provide an app-wide provider of your app's configuration.

## API

`react-config-loader` is a simple wrapper for [`@tanstack/react-query`](https://tanstack.com/query), and tries to provide the same options for queries.

### `setupConfig<Config>(initialConfig, updater, options?)`

- `initialConfig: ConfigDef<Config>`: An object with all non-optional keys from `Config` with a default value. This is the initial value for the configuration.
- `updater: () => Promise<Config>` function that returns the updated configuration. Must throw on error. See [Utils](#Utils).
- `options?: SetupConfigOptions`

  ```ts
  export type ConfigQueryOptions = Omit<
    QueryObserverOptions,
    'queryKey' | 'queryFn' | 'initialData'
  >;

  interface SetupConfigOptions {
    queryOptions?: ConfigQueryOptions;
    buster?: string;
    persister?: Persister;
  }
  ```

  - `queryOptions` allows you to override [`@tanstack/react-query`](https://tanstack.com/query)'s query options, with the exception of `queryKey, queryFn, initialData`, because these are used internally. These are the defaults used in this package:

  ```ts
  const defaultOptions = {
    staleTime: 0,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnMount: true,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  };
  ```

  - `buster` allows you to define a custom [buster](https://tanstack.com/query/v4/docs/framework/react/plugins/persistQueryClient/#cache-busting) in case you need to do manual cache overriding.
  - `persister`: allows you to use a custom [`Persister`](https://tanstack.com/query/v4/docs/framework/react/plugins/persistQueryClient) for storing your configuration. Uses `localStorage` by default.

- Returns an array of two elements:
  - The first is a hook that returns the same values as [useQuery](https://tanstack.com/query/v4/docs/framework/react/reference/useQuery), with an additional `config` that's just a reference to `data`, for simplicity.
  - The second is a wrapper that provides the context and storage (internally uses [`PersistQueryClientProvider`](https://tanstack.com/query/v4/docs/framework/react/plugins/persistQueryClient)).

### Utils

Simple utility functions.

#### `fetchConfig(url, options?): Promise<Response>`

- `url: URL | string`: URL to fetch to.
- `options?: fetchConfigOptions`:
  ```ts
  interface fetchConfigOptions {
    debugInConsole?: boolean;
    fetchOptions?: RequestInit;
  }
  ```
  - `debugInConsole`: Sets if to log errors in the console.
  - `fetchOptions`: Standard options for [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options)

#### `fetchJSON<T>(url, options?): Promise<T>`

Simple wrapper for `fetchConfig` that uses `response.json()` to load your data.
