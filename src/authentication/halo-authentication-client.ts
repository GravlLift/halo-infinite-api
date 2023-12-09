import { DateTime } from "luxon";
import type { SpartanToken } from "../models/spartan-token";
import type { SpartanTokenRequest } from "../models/spartan-token-request";
import { ExpiryTokenCache } from "../util/expiry-token-cache";

export interface Token {
  token: string;
  expiresAt: DateTime;
}

export class HaloAuthenticationClient {
  private spartanTokenCache = new ExpiryTokenCache(
    async () => {
      const xstsToken = await this.fetchXstsToken();

      const tokenRequest: SpartanTokenRequest = {
        Audience: "urn:343:s3:services",
        MinVersion: "4",
        Proof: [
          {
            Token: xstsToken,
            TokenType: "Xbox_XSTSv3",
          },
        ],
      };
      const response = await this.fetchFn(
        "https://settings.svc.halowaypoint.com/spartan-token",
        {
          method: "POST",
          body: JSON.stringify(tokenRequest),
          headers: {
            "User-Agent":
              "HaloWaypoint/2021112313511900 CFNetwork/1327.0.4 Darwin/21.2.0",
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );

      const result = (await response.json()) as SpartanToken;

      const newToken = {
        token: result.SpartanToken,
        expiresAt: DateTime.fromISO(result.ExpiresUtc.ISO8601Date),
      };
      await this.saveToken(newToken);
      return newToken;
    },
    () => this.loadToken()
  );

  constructor(
    private readonly fetchXstsToken: () => Promise<string> | string,
    private readonly loadToken: () => Promise<{
      token: string;
      expiresAt: unknown;
    } | null>,
    private readonly saveToken: (token: Token) => Promise<void>,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  public async getSpartanToken() {
    const { token } = await this.spartanTokenCache.getToken();
    return token;
  }
}
