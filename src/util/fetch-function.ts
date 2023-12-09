export type FetchFunction = <TResponse = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<TResponse>;

export const defaultFetch = async <TResponse>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<TResponse> => {
  const response = await fetch(input, init);
  return response.json();
};
