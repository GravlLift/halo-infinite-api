import { FetchFunction } from "../../util/fetch-function";
import { GlobalConstants } from "../../util/global-contants";
import { RequestError } from "../../util/request-error";
import { ResultsContainer } from "../halo-infinite-client";
import { unauthorizedRetryPolicy } from "../request-policy";
import { SpartanTokenProvider } from "../token-providers/spartan-token-provider";

interface PaginationContainer<TValue> {
  Start: number;
  Count: number;
  ResultCount: number;
  Results: TValue[];
}

export class HaloInfiniteClientBase {
  constructor(
    protected readonly spartanTokenProvider: SpartanTokenProvider,
    private readonly fetchFn: FetchFunction
  ) {}

  protected async executeRequest(
    url: string,
    init: RequestInit,
    skipAuth: boolean
  ) {
    const failureHandler = unauthorizedRetryPolicy.onFailure(
      async ({ handled }) => {
        if (handled) {
          await this.spartanTokenProvider.clearSpartanToken();
        }
      }
    );
    try {
      return await unauthorizedRetryPolicy.execute(async () => {
        const headers = new Headers(init.headers);
        if (!headers.has("User-Agent")) {
          headers.set("User-Agent", GlobalConstants.HALO_PC_USER_AGENT);
        }
        if (!headers.has("Accept")) {
          headers.set("Accept", "application/json");
        }
        if (!skipAuth) {
          headers.set(
            "x-343-authorization-spartan",
            await this.spartanTokenProvider.getSpartanToken()
          );
        }

        const response = await this.fetchFn(url, {
          ...init,
          headers,
        });

        if (!response.ok) {
          throw new RequestError(url, response);
        }

        return response;
      });
    } finally {
      failureHandler.dispose();
    }
  }

  protected async executeJsonRequest<T>(
    url: string,
    init: RequestInit,
    skipAuth?: boolean
  ) {
    const response = await this.executeRequest(url, init, skipAuth ?? false);

    if (response.status >= 200 && response.status < 300) {
      return (await response.json()) as T;
    } else {
      throw new RequestError(url, response);
    }
  }

  protected async executeResultsRequest<T>(
    ...args: Parameters<HaloInfiniteClientBase["executeJsonRequest"]>
  ) {
    let resultsContainer: ResultsContainer<T>;
    try {
      resultsContainer = await this.executeJsonRequest<ResultsContainer<T>>(
        ...args
      );
    } catch (e) {
      if (e instanceof RequestError && e.response.status === 404) {
        const contentLength = e.response.headers.get("Content-Length");
        if (contentLength && parseInt(contentLength) > 0) {
          // 404s if even one of the xuids is invalid
          resultsContainer = (await e.response.json()) as ResultsContainer<T>;
        }
      }

      throw e;
    }
    return resultsContainer.Value;
  }

  protected async executePaginationRequest<T>(
    count: number,
    start: number,
    queryParameters: Record<string, string>,
    ...args: Parameters<HaloInfiniteClientBase["executeJsonRequest"]>
  ) {
    const [url, ...rest] = args;
    const result = await this.executeJsonRequest<PaginationContainer<T>>(
      `${url}?${new URLSearchParams({
        ...queryParameters,
        count: count.toString(),
        start: start.toString(),
      })}`,
      ...rest
    );

    return result.Results;
  }
}
