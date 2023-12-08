import { DateTime } from "luxon";
import { TokenPersister } from "../core/token-persisters";
import { XboxTicket } from "../models/xbox-ticket";
import { KeyedExpiryTokenCache } from "../util/keyed-expiry-token-cache";
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
      const response = await this.fetchFn(
        "https://user.auth.xboxlive.com/user/authenticate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-xbl-contract-version": "1",
          },
          body: JSON.stringify({
            RelyingParty: "http://auth.xboxlive.com",
            TokenType: "JWT",
            Properties: {
              AuthMethod: "RPS",
              SiteName: "user.auth.xboxlive.com",
              RpsTicket: `d=${accessToken}`,
            },
          }),
        }
      );

      const result = (await response.json()) as XboxTicket;

      const token = {
        ...result,
        expiresAt: DateTime.fromISO(result.NotAfter),
      };
      await this.tokenPersister?.save("xbox.userToken", token);
      return token;
    },
    async () =>
      (await this.tokenPersister?.load<XboxTicket & { expiresAt: unknown }>(
        "xbox.userToken"
      )) ?? null
  );
  private xstsTicketCache = new KeyedExpiryTokenCache(
    async (relyingParty: RelyingParty, userToken: string) => {
      const response = await this.fetchFn(
        "https://xsts.auth.xboxlive.com/xsts/authorize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-xbl-contract-version": "1",
          },
          body: JSON.stringify({
            RelyingParty: relyingParty,
            TokenType: "JWT",
            Properties: {
              SandboxId: "RETAIL",
              UserTokens: [userToken],
            },
          }),
        }
      );
      const result = (await response.json()) as XboxTicket;

      const token = {
        ...result,
        expiresAt: DateTime.fromISO(result.NotAfter),
      };
      await this.tokenPersister?.save("xbox.xstsTicket." + relyingParty, token);
      return token;
    },
    async (relyingParty) =>
      (await this.tokenPersister?.load<XboxTicket & { expiresAt: unknown }>(
        "xbox.xstsTicket." + relyingParty
      )) ?? null
  );

  constructor(
    private readonly tokenPersister?: TokenPersister,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  public async getXstsTicket(
    getOauth2AccessToken: () => Promise<string>,
    relyingParty: RelyingParty
  ) {
    let xstsTicket = await this.xstsTicketCache.getExistingToken(relyingParty);
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
        relyingParty,
        userToken.Token
      );
    }
    return xstsTicket;
  }

  public getXboxLiveV3Token = (xboxTicket: XboxTicket) =>
    `XBL3.0 x=${xboxTicket.DisplayClaims.xui[0].uhs};${xboxTicket.Token}`;
}
