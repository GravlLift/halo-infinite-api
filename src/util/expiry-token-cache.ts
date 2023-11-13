import { DateTime } from "luxon";
import { ResolvablePromise } from "./resolvable-promise";

export class ExpiryTokenCache<
  TToken extends { expiresAt: DateTime },
  TArgs extends any[]
> {
  private tokenFetchPromise: ResolvablePromise<TToken> | undefined = undefined;

  constructor(
    private readonly tokenFetcher: (...args: TArgs) => Promise<TToken>
  ) {}

  // TODO: Compare args and separate cache entries based on input
  async getToken(...args: TArgs): Promise<TToken> {
    if (this.tokenFetchPromise) {
      // Someone either already has a token or is in the process of getting one
      // Wait for them to finish, then check for validity
      const currentToken = await this.tokenFetchPromise;

      if (currentToken.expiresAt > DateTime.now()) {
        // Current token is valid, return it
        return currentToken;
      } else {
        // Current token expired, start a new promise
        this.tokenFetchPromise = new ResolvablePromise<TToken>();

        try {
          const newToken = await this.tokenFetcher(...args);
          this.tokenFetchPromise.resolve(newToken);
          return newToken;
        } catch (e) {
          this.tokenFetchPromise.reject(e);
          this.tokenFetchPromise = undefined;
          throw e;
        }
      }
    } else {
      // No one has a token, start a new promise
      this.tokenFetchPromise = new ResolvablePromise<TToken>();

      try {
        const newToken = await this.tokenFetcher(...args);
        this.tokenFetchPromise.resolve(newToken);
        return newToken;
      } catch (e) {
        this.tokenFetchPromise.reject(e);
        this.tokenFetchPromise = undefined;
        throw e;
      }
    }
  }

  async getTokenWithoutFetch(): Promise<TToken | undefined> {
    if (this.tokenFetchPromise) {
      // Someone either already has a token or is in the process of getting one
      // Wait for them to finish, then check for validity
      const currentToken = await this.tokenFetchPromise;

      if (currentToken.expiresAt > DateTime.now()) {
        // Current token is valid, return it
        return currentToken;
      }
    }
    return undefined;
  }
}
