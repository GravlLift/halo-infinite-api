import { DateTime } from "luxon";
import type { SpartanToken } from "../models/spartan-token.js";
import type { SpartanTokenRequest } from "../models/spartan-token-request.js";
import { ExpiryTokenCache } from "../util/expiry-token-cache.js";
import { FetchFunction, defaultFetch } from "../util/fetch-function.js";
import { GlobalConstants } from "../util/global-contants.js";
import { RequestError } from "../util/request-error.js";
import { unauthorizedRetryPolicy } from "../core/request-policy.js";
import { HaloCoreEndpoints } from "../endpoints/halo-core-endpoints.js";

export interface Token {
  token: string;
  expiresAt: DateTime;
}

export class HaloAuthenticationClient {
  private spartanTokenCache = new ExpiryTokenCache(
    async () => {
      const failureHandler = unauthorizedRetryPolicy.onFailure(
        async ({ handled }) => {
          if (handled) {
            await this.clearXstsToken();
          }
        }
      );
      try {
        return await unauthorizedRetryPolicy.execute(async () => {
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
          const url = `https://${HaloCoreEndpoints.SettingsOrigin}.${HaloCoreEndpoints.ServiceDomain}/spartan-token`;
          const response = await this.fetchFn(url, {
            method: "POST",
            body: JSON.stringify(tokenRequest),
            headers: {
              "User-Agent": GlobalConstants.HALO_WAYPOINT_USER_AGENT,
              "Content-Type": "application/json; charset=utf-8",
              Accept: "application/json, text/plain, */*",
            },
          });
          if (response.status >= 200 && response.status < 300) {
            const result_2 = (await response.json()) as SpartanToken;

            const newToken = {
              token: result_2.SpartanToken,
              expiresAt: DateTime.fromISO(result_2.ExpiresUtc.ISO8601Date),
            };
            await this.saveToken(newToken);
            return newToken;
          } else {
            throw new RequestError(url, response);
          }
        });
      } finally {
        failureHandler.dispose();
      }
    },
    () => this.loadToken()
  );

  constructor(
    private readonly fetchXstsToken: () => Promise<string> | string,
    private readonly clearXstsToken: () => Promise<void>,
    private readonly loadToken: () => Promise<{
      token: string;
      expiresAt: unknown;
    } | null>,
    private readonly saveToken: (token: Token) => Promise<void>,
    private readonly clearToken: () => Promise<void>,
    private readonly fetchFn: FetchFunction = defaultFetch
  ) {}

  public async getSpartanToken() {
    const { token } = await this.spartanTokenCache.getToken();
    return token;
  }

  public async clearSpartanToken() {
    // Clear from memory
    this.spartanTokenCache.clearToken();
    // Clear from storage
    await this.clearToken();
  }
}
