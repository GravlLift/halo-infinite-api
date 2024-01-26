import { DateTime } from "luxon";
import { TokenPersister } from "../core/token-persisters";
import { XboxTicket } from "../models/xbox-ticket";
import { KeyedExpiryTokenCache } from "../util/keyed-expiry-token-cache";
import { ExpiryTokenCache } from "../util/expiry-token-cache";
import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { RequestError } from "../util/request-error";
import { unauthorizedRetryPolicy } from "../core/request-policy";

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
      const url = "https://user.auth.xboxlive.com/user/authenticate";
      const response = await this.fetchFn(url, {
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
      });

      if (response.status >= 200 && response.status < 300) {
        const result = (await response.json()) as XboxTicket;

        const token = {
          ...result,
          expiresAt: DateTime.fromISO(result.NotAfter),
        };
        await (
          await this.tokenPersisterOrPromise
        )?.save("xbox.userToken", token);
        return token;
      } else {
        throw new RequestError(url, response);
      }
    },
    async () => {
      const tokenPersister = await this.tokenPersisterOrPromise;
      return (
        (await tokenPersister?.load<XboxTicket & { expiresAt: unknown }>(
          "xbox.userToken"
        )) ?? null
      );
    }
  );
  private xstsTicketCache = new KeyedExpiryTokenCache(
    async (relyingParty: RelyingParty, userToken: string) => {
      const url = "https://xsts.auth.xboxlive.com/xsts/authorize";
      const response = await this.fetchFn(url, {
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
      });

      if (response.status >= 200 && response.status < 300) {
        const result = (await response.json()) as XboxTicket;

        const token = {
          ...result,
          expiresAt: DateTime.fromISO(result.NotAfter),
        };
        await (
          await this.tokenPersisterOrPromise
        )?.save("xbox.xstsTicket." + relyingParty, token);
        return token;
      } else {
        throw new RequestError(url, response);
      }
    },
    async (relyingParty) =>
      (await (
        await this.tokenPersisterOrPromise
      )?.load<XboxTicket & { expiresAt: unknown }>(
        "xbox.xstsTicket." + relyingParty
      )) ?? null
  );

  constructor(
    private readonly tokenPersisterOrPromise?:
      | TokenPersister
      | Promise<TokenPersister>,
    private readonly fetchFn: FetchFunction = defaultFetch
  ) {}

  public async getXstsTicket(
    getOauth2AccessToken: () => Promise<string>,
    relyingParty: RelyingParty
  ) {
    let xstsTicket = await this.xstsTicketCache.getExistingToken(relyingParty);
    if (!xstsTicket) {
      let userToken = await this.userTokenCache.getExistingToken();
      const xstsTicketFailureHandler = unauthorizedRetryPolicy.onFailure(() => {
        this.userTokenCache.clearToken();
      });
      xstsTicket = await unauthorizedRetryPolicy
        .execute(async () => {
          // Ouath2 token depends on nothing, so we can fetch it without
          // worrying if it is expired.
          const oauthToken = await getOauth2AccessToken();
          userToken = await this.userTokenCache.getToken(oauthToken);
          return this.xstsTicketCache.getToken(relyingParty, userToken!.Token);
        })
        .finally(() => xstsTicketFailureHandler.dispose());
    }
    return xstsTicket;
  }

  public clearXstsTicket = async (relyingParty: RelyingParty) => {
    this.xstsTicketCache.clearToken(relyingParty);
  };

  public getXboxLiveV3Token = (xboxTicket: XboxTicket) =>
    `XBL3.0 x=${xboxTicket.DisplayClaims.xui[0].uhs};${xboxTicket.Token}`;
}
