import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { XboxTokenProvider } from "./token-providers/xbox-token-provider";

export class XboxClient {
  constructor(
    private readonly xboxTokenProvider: XboxTokenProvider,
    private readonly fetchFn: FetchFunction = defaultFetch
  ) {}

  private async executeRequest<T>(url: string, method: RequestInit["method"]) {
    const result = await this.fetchFn<T>(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: await this.xboxTokenProvider.getXboxLiveV3Token(),
        "x-xbl-contract-version": "1",
      },
    });

    return result;
  }

  public async searchUsers(query: string) {
    const { results } = await this.executeRequest<{
      results: [
        {
          result: {
            id: string;
            gamertag: string;
            displayPicUri: string;
            score: 0.0;
          };
          text: string;
        }
      ];
    }>(
      `https://usersearch.xboxlive.com/suggest?q=${encodeURIComponent(query)}`,
      "GET"
    );
    return results.map(({ result }) => result);
  }

  public async recentPlayers() {
    return await this.executeRequest<unknown>(
      "https://peoplehub.xboxlive.com/users/me/people/recentplayers",
      "GET"
    );
  }
}
