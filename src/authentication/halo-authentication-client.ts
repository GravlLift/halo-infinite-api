import { DateTime } from "luxon";
import type { SpartanToken } from "../models/spartan-token";
import type { SpartanTokenRequest } from "../models/spartan-token-request";
import { ExpiryTokenCache } from "../util/expiry-token-cache";
import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { GlobalConstants } from "../util/global-contants";
import { RequestError } from "../util/request-error";
import { unauthorizedRetryPolicy } from "../core/request-policy";
import { HaloCoreEndpoints } from "../endpoints/halo-core-endpoints";
import { SpartanTokenProvider } from "..";

export interface Token {
  token: string;
  expiresAt: DateTime;
}

export class HaloAuthenticationClient implements SpartanTokenProvider {
  private spartanTokenCache = new ExpiryTokenCache(
    async () => {
      const failureHandler = unauthorizedRetryPolicy.onFailure(
        async ({ handled }) => {
          if (handled) {
            await this.xsts.clearXstsToken();
          }
        }
      );
      try {
        return await unauthorizedRetryPolicy.execute(async () => {
          const xstsToken = await this.xsts.fetchToken();

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
            await this.tokenStore.saveToken(newToken);
            return newToken;
          } else {
            throw new RequestError(url, response);
          }
        });
      } finally {
        failureHandler.dispose();
      }
    },
    () => this.tokenStore.loadToken()
  );

  constructor(
    private readonly xsts: {
      fetchToken: () => Promise<string> | string;
      clearXstsToken: () => Promise<void>;
    },
    private readonly tokenStore: {
      loadToken: () => Promise<{
        token: string;
        expiresAt: unknown;
      } | null>;
      saveToken: (token: Token) => Promise<void>;
      clearToken: () => Promise<void>;
    },
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
    await this.tokenStore.clearToken();
  }

  public async getCurrentExpiration(): Promise<DateTime | null> {
    const currentToken = await this.spartanTokenCache.getExistingToken();
    return currentToken ? currentToken.expiresAt : null;
  }
}
