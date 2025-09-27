import { DateTime } from "luxon";
import { ResolvablePromise } from "./resolvable-promise";
import { coalesceDateTime } from "./date-time";

export class ExpiryTokenCache<
  TToken extends { expiresAt: DateTime },
  TArgs extends any[]
> {
  private tokenFetchPromise: ResolvablePromise<TToken> | undefined = undefined;

  constructor(
    private readonly generateNewToken: (...args: TArgs) => Promise<TToken>,
    private readonly existingTokenFetcher: () => Promise<
      (Omit<TToken, "expiresAt"> & { expiresAt: unknown }) | null
    >
  ) {}

  // TODO: Compare args and separate cache entries based on input
  async getToken(...args: TArgs): Promise<TToken> {
    if (this.tokenFetchPromise) {
      // Someone either already has a token or is in the process of getting one
      // Wait for them to finish, then check for validity
      const currentToken = await this.tokenFetchPromise;

      if (currentToken.expiresAt > DateTime.now().minus({ minute: 1 })) {
        // Current token is valid, return it
        return currentToken;
      } else {
        // Current token expired, start a new promise
        const newPromise = new ResolvablePromise<TToken>();
        this.tokenFetchPromise = newPromise;

        try {
          const newToken = await this.generateNewToken(...args);
          newPromise.resolve(newToken);
          return newToken;
        } catch (e) {
          newPromise.reject(e);
          if (this.tokenFetchPromise === newPromise) {
            this.tokenFetchPromise = undefined;
          }
          throw e;
        }
      }
    } else {
      // No one has a token, start a new promise
      const newPromise = new ResolvablePromise<TToken>();
      this.tokenFetchPromise = newPromise;

      try {
        const existingToken = await this.getExistingToken();

        if (existingToken?.expiresAt) {
          const expiresAt = coalesceDateTime(existingToken.expiresAt);
          if (expiresAt && expiresAt > DateTime.now()) {
            const newToken = { ...existingToken, expiresAt } as TToken;
            newPromise.resolve(newToken);
            return newToken;
          }
        }

        const newToken = await this.generateNewToken(...args);
        newPromise.resolve(newToken);
        return newToken;
      } catch (e) {
        newPromise.reject(e);
        if (this.tokenFetchPromise === newPromise) {
          this.tokenFetchPromise = undefined;
        }
        throw e;
      }
    }
  }

  async getExistingToken() {
    const existingToken = await this.existingTokenFetcher();

    if (existingToken?.expiresAt) {
      const expiresAt = coalesceDateTime(existingToken.expiresAt);
      if (expiresAt && expiresAt > DateTime.now()) {
        return { ...existingToken, expiresAt } as TToken;
      }
    }

    return null;
  }

  clearToken() {
    this.tokenFetchPromise = undefined;
  }
}
