import axios, { AxiosInstance } from "axios";
import getPkce from "oauth-pkce";
import { DateTime } from "luxon";
import { XboxTicket } from "../models/xbox-ticket";

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
  private currentTokenPromise: Promise<XboxAuthenticationToken> | undefined =
    undefined;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly clientId: string,
    private readonly redirectUri: string,
    private readonly getAuthCode: (authorizeUrl: string) => Promise<string>,
    private readonly loadToken: () => Promise<XboxAuthenticationToken | null>,
    private readonly saveToken: (
      token: XboxAuthenticationToken
    ) => Promise<void>
  ) {
    this.httpClient = axios.create();
  }

  private getPkce() {
    return new Promise<{
      verifier: string;
      challenge: string;
    }>((resolve, reject) => {
      getPkce(43, (err, { verifier, challenge }) => {
        if (err) {
          reject(err);
        } else {
          resolve({ verifier, challenge });
        }
      });
    });
  }

  public async getAccessToken() {
    if (this.currentTokenPromise) {
      // Someone either already has a token or is in the process of getting one
      // Wait for them to finish, then check for validity
      const currentToken = await this.currentTokenPromise;

      if (currentToken.expiresAt > DateTime.now()) {
        // Current token is valid, return it
        return currentToken.token;
      } else {
        // Current token expired, start a new promise
        let promiseResolver!: (token: XboxAuthenticationToken) => void;
        let promiseRejector!: (error: unknown) => void;
        this.currentTokenPromise = new Promise<XboxAuthenticationToken>(
          (resolve, reject) => {
            promiseResolver = resolve;
            promiseRejector = reject;
          }
        );

        try {
          const newToken = await this.refreshOAuth2Token(
            currentToken.refreshToken
          );
          promiseResolver(newToken);
          await this.saveToken(newToken);
          return newToken.token;
        } catch (e) {
          promiseRejector(e);
          throw e;
        }
      }
    } else {
      // We are the first caller, create a promise to block subsequent callers
      let promiseResolver!: (token: XboxAuthenticationToken) => void;
      let promiseRejector!: (error: unknown) => void;
      this.currentTokenPromise = new Promise<XboxAuthenticationToken>(
        (resolve, reject) => {
          promiseResolver = resolve;
          promiseRejector = reject;
        }
      );

      try {
        const currentToken = await this.loadToken();

        if (currentToken && currentToken.expiresAt > DateTime.now()) {
          // Current token is valid, return it and alert other callers if applicable
          promiseResolver(currentToken);
          return currentToken.token;
        } else {
          const newToken = await this.fetchOauth2Token();
          promiseResolver(newToken);
          await this.saveToken(newToken);
          return newToken.token;
        }
      } catch (e) {
        promiseRejector(e);
        throw e;
      }
    }
  }

  private async fetchOauth2Token(): Promise<XboxAuthenticationToken> {
    const { verifier, challenge } = await this.getPkce();

    const authorizeUrl = `https://login.live.com/oauth20_authorize.srf?${new URLSearchParams(
      {
        client_id: this.clientId,
        response_type: "code",
        redirect_uri: this.redirectUri,
        scope: SCOPES.join(" "),
        code_challenge_method: "S256",
        code_challenge: challenge,
      }
    )}`;

    const code = await this.getAuthCode(authorizeUrl);

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
        code_verifier: verifier,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const responseDate = DateTime.fromRFC2822(response.headers["date"]);
    return {
      token: response.data.access_token,
      expiresAt: responseDate.plus({ seconds: response.data.expires_in }),
      refreshToken: response.data.refresh_token,
    };
  }

  private async refreshOAuth2Token(
    refreshToken: string
  ): Promise<XboxAuthenticationToken> {
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

    const responseDate = DateTime.fromRFC2822(response.headers["date"]);
    return {
      token: response.data.access_token,
      expiresAt: responseDate.plus({ seconds: response.data.expires_in }),
      refreshToken: response.data.refresh_token,
    };
  }

  public async getUserToken(accessToken: string) {
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

    return response.data.Token;
  }

  public async getXstsTicket(userToken: string, relyingParty: RelyingParty) {
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

    return response.data;
  }

  public getXboxLiveV3Token = (userHash: string, userToken: string) =>
    `XBL3.0 x=${userHash};${userToken}`;
}
