import { DateTime } from "luxon";
import type { SpartanToken } from "../models/spartan-token";
import type { SpartanTokenRequest } from "../models/spartan-token-request";
import { ExpiryTokenCache } from "../util/expiry-token-cache";
import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { GlobalConstants } from "../util/global-contants";

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
      const result = await this.fetchFn<SpartanToken>(
        "https://settings.svc.halowaypoint.com/spartan-token",
        {
          method: "POST",
          body: JSON.stringify(tokenRequest),
          headers: {
            "User-Agent": GlobalConstants.HALO_WAYPOINT_USER_AGENT,
            "Content-Type": "application/json; charset=utf-8",
            Accept: "application/json, text/plain, */*",
          },
        }
      );

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
    private readonly fetchFn: FetchFunction = defaultFetch
  ) {}

  public async getSpartanToken() {
    const { token } = await this.spartanTokenCache.getToken();
    return token;
  }
}
