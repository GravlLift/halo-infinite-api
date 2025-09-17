import { RequestError } from "../util/request-error";
import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { XboxTokenProvider } from "./token-providers/xbox-token-provider";
import { unauthorizedRetryPolicy } from "./request-policy";
import { unwrapPlayerId } from "../util/xuid";

export class XboxClient {
  constructor(
    private readonly xboxTokenProvider: XboxTokenProvider,
    private readonly fetchFn: FetchFunction = defaultFetch
  ) {}

  private async executeRequest<T>(url: string, init: RequestInit): Promise<T> {
    const failureHandler = unauthorizedRetryPolicy.onFailure(
      async ({ handled }) => {
        if (handled) {
          await this.xboxTokenProvider.clearXboxLiveV3Token();
        }
      }
    );
    try {
      return await unauthorizedRetryPolicy.execute(async () => {
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
          headers.set("x-xbl-contract-version", "3");
        }
        const response = await this.fetchFn(url, {
          ...init,
          headers,
        });

        if (response.status >= 200 && response.status < 300) {
          return (await response.json()) as T;
        } else {
          throw new RequestError(url, response);
        }
      });
    } finally {
      failureHandler.dispose();
    }
  }

  public async getCurrentUser(init?: Omit<RequestInit, "body" | "method">) {
    return await this.executeRequest<{
      xuid: string;
      gamertag: string;
      gamerpic: {
        small: string;
        medium: string;
        large: string;
        xlarge: string;
      };
    }>("https://profile.svc.halowaypoint.com/users/me", {
      ...init,
      method: "GET",
    });
  }

  public async searchUsers(
    query: string,
    maxItems: number = 5,
    init?: Omit<RequestInit, "body" | "method">
  ) {
    const { people } = await this.executeRequest<{
      people: [
        {
          xuid: string;
          gamertag: string;
          displayPicRaw: string;
        }
      ];
    }>(
      `https://peoplehub.xboxlive.com/users/me/people/search?q=${encodeURIComponent(
        query
      )}&maxItems=${maxItems}`,
      { ...init, method: "GET" }
    );
    return people;
  }

  public async recentPlayers(init?: Omit<RequestInit, "body" | "method">) {
    return await this.executeRequest<unknown>(
      "https://peoplehub.xboxlive.com/users/me/people/recentplayers",
      { ...init, method: "GET" }
    );
  }

  public async getProfiles(
    xuids: string[],
    settings: string[],
    init?: Omit<RequestInit, "body" | "method">
  ) {
    init?.headers;
    return await this.executeRequest<{
      profileUsers: {
        id: string;
        settings: { id: string; value: string }[];
      }[];
    }>("https://profile.xboxlive.com/users/batch/profile/settings", {
      ...init,
      headers: {
        ...init?.headers,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        userIds: xuids.map(unwrapPlayerId),
        settings,
      }),
    });
  }
}
