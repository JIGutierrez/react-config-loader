interface fetchConfigOptions {
  debugInConsole?: boolean;
  fetchOptions?: RequestInit;
}

function logError(response: Response, debugInConsole: boolean): never {
  if (debugInConsole) {
    response
      .json()
      .then((errorInfo) => console.error('Fetch Error:', errorInfo))
      .catch(async () => {
        // If parsing fails (e.g., the body is not JSON), log the plain text response
        const errorText = await response.text();
        console.error('Error details:', errorText);
      });
  }
  throw new Error(`Fetch Config Error ${response.status}`);
}

export async function fetchConfig(
  url: URL | string,
  options?: fetchConfigOptions
): Promise<Response> {
  const response = await fetch(url, options?.fetchOptions);
  if (!response.ok) {
    logError(response, options?.debugInConsole || false);
  }
  return response;
}

export async function fetchJSON<T>(url: URL | string, options?: fetchConfigOptions): Promise<T> {
  return fetchConfig(url, options).then((r) => r.json() as T);
}
