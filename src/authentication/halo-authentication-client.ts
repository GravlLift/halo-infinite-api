import axios, { AxiosInstance } from "axios";
import type { SpartanToken } from "../models/spartan-token";
import type { SpartanTokenRequest } from "../models/spartan-token-request";
import { DateTime } from "luxon";

export interface Token {
  token: string;
  expiresAt: DateTime;
}

export class HaloAuthenticationClient {
  private currentTokenPromise: Promise<Token> | undefined = undefined;

  constructor(
    private readonly fetchXstsToken: () => Promise<string>,
    private readonly loadToken: () => Promise<Token | null>,
    private readonly saveToken: (token: Token) => Promise<void>
  ) {}

  public async getSpartanToken() {
    if (this.currentTokenPromise) {
      // Someone either already has a token or is in the process of getting one
      // Wait for them to finish, then check for validity
      const currentToken = await this.currentTokenPromise;

      if (currentToken.expiresAt > DateTime.now()) {
        // Current token is valid, return it
        return currentToken.token;
      } else {
        // Current token expired, start a new promise
        let promiseResolver!: (token: Token) => void;
        let promiseRejector!: (error: unknown) => void;
        this.currentTokenPromise = new Promise<Token>((resolve, reject) => {
          promiseResolver = resolve;
          promiseRejector = reject;
        });

        try {
          const xstsToken = await this.fetchXstsToken();
          const newToken = await this.fetchSpartanToken(xstsToken);
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
      let promiseResolver!: (token: Token) => void;
      let promiseRejector!: (error: unknown) => void;
      this.currentTokenPromise = new Promise<Token>((resolve, reject) => {
        promiseResolver = resolve;
        promiseRejector = reject;
      });

      try {
        const currentToken = await this.loadToken();

        if (currentToken && currentToken.expiresAt > DateTime.now()) {
          // Current token is valid, return it and alert other callers if applicable
          promiseResolver(currentToken);
          return currentToken.token;
        } else {
          const xstsToken = await this.fetchXstsToken();
          const newToken = await this.fetchSpartanToken(xstsToken);
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

  private async fetchSpartanToken(xstsToken: string) {
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
    return {
      token: response.data.SpartanToken,
      expiresAt: DateTime.fromISO(response.data.ExpiresUtc.ISO8601Date),
    };
  }
}
