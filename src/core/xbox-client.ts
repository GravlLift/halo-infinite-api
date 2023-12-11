import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { XboxTokenProvider } from "./token-providers/xbox-token-provider";

export class XboxClient {
  constructor(
    private readonly xboxTokenProvider: XboxTokenProvider,
    private readonly fetchFn: FetchFunction = defaultFetch
  ) {}

  private async executeRequest<T>(url: string, init: RequestInit) {
    const headers = new Headers(init.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (!headers.has("Authorization")) {
      headers.set(
        "Authorization",
        await this.xboxTokenProvider.getXboxLiveV3Token()
      );
    }
    if (!headers.has("x-xbl-contract-version")) {
      headers.set("x-xbl-contract-version", "1");
    }
    const result = await this.fetchFn<T>(url, {
      ...init,
      headers,
    });

    return result;
  }

  public async searchUsers(
    query: string,
    init?: Omit<RequestInit, "body" | "method">
  ) {
    const { results } = await this.executeRequest<{
      results: [
        {
          result: {
            id: string;
            gamertag: string;
            displayPicUri: string;
            score: number;
          };
          text: string;
        }
      ];
    }>(
      `https://usersearch.xboxlive.com/suggest?q=${encodeURIComponent(query)}`,
      { ...init, method: "GET" }
    );
    return results.map(({ result }) => result);
  }

  public async recentPlayers(init?: Omit<RequestInit, "body" | "method">) {
    return await this.executeRequest<unknown>(
      "https://peoplehub.xboxlive.com/users/me/people/recentplayers",
      { ...init, method: "GET" }
    );
  }
}
