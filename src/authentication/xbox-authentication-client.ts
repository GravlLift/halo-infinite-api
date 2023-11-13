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
  private userTokenCache = new ExpiryTokenCache(
    async (accessToken: string) => {
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
    },
    async () =>
      (await this.tokenPersister?.load<XboxTicket & { expiresAt: unknown }>(
        "xbox.userToken"
      )) ?? null
  );
  private xstsTicketCache = new ExpiryTokenCache(
    async (userToken: string, relyingParty: RelyingParty) => {
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
    },
    async () =>
      (await this.tokenPersister?.load<XboxTicket & { expiresAt: unknown }>(
        "xbox.xstsTicket"
      )) ?? null
  );

  private readonly httpClient: AxiosInstance;

  constructor(private readonly tokenPersister?: TokenPersister) {
    this.httpClient = axios.create();
  }

  public async getXstsTicket(getOauth2AccessToken: () => Promise<string>) {
    let xstsTicket = await this.xstsTicketCache.getExistingToken();
    if (!xstsTicket) {
      let userToken = await this.userTokenCache.getExistingToken();
      if (!userToken) {
        // Ouath2 token depends on nothing, so we can fetch it without
        // worrying if it is expired.
        userToken = await this.userTokenCache.getToken(
          await getOauth2AccessToken()
        );
      }
      xstsTicket = await this.xstsTicketCache.getToken(
        userToken.Token,
        RelyingParty.Halo
      );
    }
    return xstsTicket;
  }

  public getXboxLiveV3Token = (userHash: string, userToken: string) =>
    `XBL3.0 x=${userHash};${userToken}`;
}
