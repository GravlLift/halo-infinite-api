import axios, { AxiosInstance } from "axios";
import { DateTime } from "luxon";
import { TokenPersister } from "../core/token-persisters";
import { XboxTicket } from "../models/xbox-ticket";
import { coalesceDateTime } from "../util/date-time";
import { ExpiryTokenCache } from "../util/expiry-token-cache";

export enum RelyingParty {
  Xbox = "http://xboxlive.com",
  Halo = "https://prod.xsts.halowaypoint.com/",
}

export interface XboxAuthenticationToken {
  token: string;
  expiresAt: DateTime;
  refreshToken: string;
}

export class XboxAuthenticationClient {
  private userTokenCache = new ExpiryTokenCache(async (accessToken: string) => {
    const persistedToken = await this.tokenPersister?.load<
      XboxTicket & { expiresAt?: unknown }
    >("xbox.userToken");

    if (persistedToken?.expiresAt) {
      const expiresAt = coalesceDateTime(persistedToken.expiresAt);
      if (expiresAt && expiresAt > DateTime.now()) {
        return { ...persistedToken, expiresAt };
      }
    }

    const response = await this.httpClient.post<XboxTicket>(
      "https://user.auth.xboxlive.com/user/authenticate",
      {
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `d=${accessToken}`,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-xbl-contract-version": "1",
        },
      }
    );

    const result = {
      ...response.data,
      expiresAt: DateTime.fromISO(response.data.NotAfter),
    };
    await this.tokenPersister?.save("xbox.userToken", result);
    return result;
  });
  private xstsTicketCache = new ExpiryTokenCache(
    async (userToken: string, relyingParty: RelyingParty) => {
      const persistedToken = await this.tokenPersister?.load<
        XboxTicket & { expiresAt: DateTime }
      >("xbox.xstsTicket");

      if (persistedToken?.expiresAt) {
        const expiresAt = coalesceDateTime(persistedToken.expiresAt);
        if (expiresAt && expiresAt > DateTime.now()) {
          return { ...persistedToken, expiresAt };
        }
      }

      const response = await this.httpClient.post<XboxTicket>(
        "https://xsts.auth.xboxlive.com/xsts/authorize",
        {
          RelyingParty: relyingParty,
          TokenType: "JWT",
          Properties: {
            SandboxId: "RETAIL",
            UserTokens: [userToken],
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-xbl-contract-version": "1",
          },
        }
      );

      const result = {
        ...response.data,
        expiresAt: DateTime.fromISO(response.data.NotAfter),
      };
      await this.tokenPersister?.save("xbox.xstsTicket", result);
      return result;
    }
  );

  private readonly httpClient: AxiosInstance;

  constructor(private readonly tokenPersister?: TokenPersister) {
    this.httpClient = axios.create();
  }

  public async getUserToken(accessToken: string) {
    const { Token } = await this.userTokenCache.getToken(accessToken);
    return Token;
  }

  public getXstsTicket(userToken: string, relyingParty: RelyingParty) {
    return this.xstsTicketCache.getToken(userToken, relyingParty);
  }

  public getXboxLiveV3Token = (userHash: string, userToken: string) =>
    `XBL3.0 x=${userHash};${userToken}`;
}
