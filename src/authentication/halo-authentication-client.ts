import axios from "axios";
import { DateTime } from "luxon";
import type { SpartanToken } from "../models/spartan-token";
import type { SpartanTokenRequest } from "../models/spartan-token-request";
import { coalesceDateTime } from "../util/date-time";
import { ExpiryTokenCache } from "../util/expiry-token-cache";

export interface Token {
  token: string;
  expiresAt: DateTime;
}

export class HaloAuthenticationClient {
  private spartanTokenCache = new ExpiryTokenCache(async () => {
    const persistedToken = await this.loadToken();

    if (persistedToken?.expiresAt) {
      const currentToken = {
        token: persistedToken.token,
        expiresAt: coalesceDateTime(persistedToken.expiresAt) as DateTime,
      };
      if (currentToken.expiresAt && currentToken.expiresAt > DateTime.now()) {
        return currentToken;
      }
    }

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
    const response = await axios.post<SpartanToken>(
      "https://settings.svc.halowaypoint.com/spartan-token",
      tokenRequest,
      {
        headers: {
          "User-Agent":
            "HaloWaypoint/2021112313511900 CFNetwork/1327.0.4 Darwin/21.2.0",
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );

    const newToken = {
      token: response.data.SpartanToken,
      expiresAt: DateTime.fromISO(response.data.ExpiresUtc.ISO8601Date),
    };
    await this.saveToken(newToken);
    return newToken;
  });

  constructor(
    private readonly fetchXstsToken: () => Promise<string> | string,
    private readonly loadToken: () => Promise<{
      token: string;
      expiresAt: unknown;
    } | null>,
    private readonly saveToken: (token: Token) => Promise<void>
  ) {}

  public async getSpartanToken() {
    const { token } = await this.spartanTokenCache.getToken();
    return token;
  }
}
