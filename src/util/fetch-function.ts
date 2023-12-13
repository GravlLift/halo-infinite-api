export type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export const defaultFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => fetch(input, init);
