import axios, { AxiosInstance } from "axios";
import pkceChallenge from "pkce-challenge";
import { DateTime } from "luxon";
import { XboxTicket } from "../models/xbox-ticket";
import { coalesceDateTime } from "../util/date-time";
import { ResolvablePromise } from "../util/resolvable-promise";
import { ExpiryTokenCache } from "../util/expiry-token-cache";
import { TokenPersister } from "../core/token-persisters";

const SCOPES = ["Xboxlive.signin", "Xboxlive.offline_access"];

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
  private accessTokenPromise:
    | ResolvablePromise<XboxAuthenticationToken>
    | undefined = undefined;
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

  constructor(
    private readonly clientId: string,
    private readonly redirectUri: string,
    private readonly getAuthCode: (authorizeUrl: string) => Promise<string>,
    private readonly tokenPersister?: TokenPersister
  ) {
    this.httpClient = axios.create();
  }

  private getPkce() {
    // Some sort of module issue here, we work around it
    type PkceChallenge = typeof pkceChallenge;
    if (typeof pkceChallenge === "function") {
      return pkceChallenge(43);
    } else {
      return (pkceChallenge as { default: PkceChallenge }).default(43);
    }
  }

  public async getAccessToken() {
    if (this.accessTokenPromise) {
      // Someone either already has a token or is in the process of getting one
      // Wait for them to finish, then check for validity
      const currentToken = await this.accessTokenPromise;

      if (currentToken.expiresAt > DateTime.now()) {
        // Current token is valid, return it
        return currentToken.token;
      } else {
        // Current token expired, start a new promise
        this.accessTokenPromise =
          new ResolvablePromise<XboxAuthenticationToken>();

        try {
          const newToken = await this.refreshOAuth2Token(
            currentToken.refreshToken
          );
          this.accessTokenPromise.resolve(newToken);
          await this.tokenPersister?.save("xbox.accessToken", newToken);
          return newToken.token;
        } catch (e) {
          this.accessTokenPromise.reject(e);
          throw e;
        }
      }
    } else {
      // We are the first caller, create a promise to block subsequent callers
      this.accessTokenPromise =
        new ResolvablePromise<XboxAuthenticationToken>();

      try {
        const loadedToken =
          await this.tokenPersister?.load<XboxAuthenticationToken>(
            "xbox.accessToken"
          );
        const currentToken = {
          ...loadedToken,
          token: loadedToken?.token ?? "",
          expiresAt: coalesceDateTime(loadedToken?.expiresAt),
        };

        if (currentToken.expiresAt && currentToken.expiresAt > DateTime.now()) {
          // Current token is valid, return it and alert other callers if applicable
          this.accessTokenPromise.resolve(
            currentToken as XboxAuthenticationToken
          );
          return currentToken.token;
        } else {
          const newToken = await this.fetchOauth2Token();
          this.accessTokenPromise.resolve(newToken);
          await this.tokenPersister?.save("xbox.accessToken", newToken);
          return newToken.token;
        }
      } catch (e) {
        this.accessTokenPromise.reject(e);
        throw e;
      }
    }
  }

  private async fetchOauth2Token(): Promise<XboxAuthenticationToken> {
    const { code_verifier, code_challenge } = this.getPkce();

    const authorizeUrl = `https://login.live.com/oauth20_authorize.srf?${new URLSearchParams(
      {
        client_id: this.clientId,
        response_type: "code",
        redirect_uri: this.redirectUri,
        scope: SCOPES.join(" "),
        code_challenge_method: "S256",
        code_challenge,
      }
    )}`;

    const code = await this.getAuthCode(authorizeUrl);

    const requestStart = DateTime.now();
    const response = await this.httpClient.post<{
      access_token: string;
      expires_in: number;
      scope: string;
      token_type: string;
      user_id: string;
      refresh_token: string;
    }>(
      "https://login.live.com/oauth20_token.srf",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        approval_prompt: "auto",
        scope: SCOPES.join(" "),
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    return {
      token: response.data.access_token,
      expiresAt: requestStart.plus({ seconds: response.data.expires_in }),
      refreshToken: response.data.refresh_token,
    };
  }

  private async refreshOAuth2Token(
    refreshToken: string
  ): Promise<XboxAuthenticationToken> {
    const requestStart = DateTime.now();
    const response = await this.httpClient.post<{
      access_token: string;
      expires_in: number;
      scope: string;
      token_type: string;
      user_id: string;
      refresh_token: string;
    }>(
      "https://login.live.com/oauth20_token.srf",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: SCOPES.join(" "),
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    return {
      token: response.data.access_token,
      expiresAt: requestStart.plus({ seconds: response.data.expires_in }),
      refreshToken: response.data.refresh_token,
    };
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
