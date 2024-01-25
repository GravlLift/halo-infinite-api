import { DateTime } from "luxon";
import { ResolvablePromise } from "./resolvable-promise";
import { coalesceDateTime } from "./date-time";

export class KeyedExpiryTokenCache<
  TToken extends { expiresAt: DateTime },
  TKey extends string,
  TArgs extends any[]
> {
  private readonly tokenFetchPromiseMap = new Map<
    TKey,
    ResolvablePromise<TToken>
  >();

  constructor(
    private readonly generateNewToken: (
      key: TKey,
      ...args: TArgs
    ) => Promise<TToken>,
    private readonly existingTokenFetcher: (
      key: TKey
    ) => Promise<(Omit<TToken, "expiresAt"> & { expiresAt: unknown }) | null>
  ) {}

  async getToken(key: TKey, ...args: TArgs): Promise<TToken> {
    let tokenFetchPromise = this.tokenFetchPromiseMap.get(key);
    if (tokenFetchPromise) {
      // Someone either already has a token or is in the process of getting one
      // Wait for them to finish, then check for validity
      const currentToken = await tokenFetchPromise;

      if (currentToken.expiresAt > DateTime.now()) {
        // Current token is valid, return it
        return currentToken;
      } else {
        // Current token expired, start a new promise
        tokenFetchPromise = new ResolvablePromise<TToken>();
        this.tokenFetchPromiseMap.set(key, tokenFetchPromise);

        try {
          const newToken = await this.generateNewToken(key, ...args);
          tokenFetchPromise.resolve(newToken);
          return newToken;
        } catch (e) {
          tokenFetchPromise.reject(e);
          tokenFetchPromise = undefined;
          throw e;
        }
      }
    } else {
      // No one has a token, start a new promise
      tokenFetchPromise = new ResolvablePromise<TToken>();
      this.tokenFetchPromiseMap.set(key, tokenFetchPromise);

      try {
        const existingToken = await this.getExistingToken(key);

        if (existingToken?.expiresAt) {
          const expiresAt = coalesceDateTime(existingToken.expiresAt);
          if (expiresAt && expiresAt > DateTime.now().minus({ minute: 1 })) {
            const newToken = { ...existingToken, expiresAt } as TToken;
            tokenFetchPromise.resolve(newToken);
            return newToken;
          }
        }

        const newToken = await this.generateNewToken(key, ...args);
        tokenFetchPromise.resolve(newToken);
        return newToken;
      } catch (e) {
        tokenFetchPromise.reject(e);
        tokenFetchPromise = undefined;
        throw e;
      }
    }
  }

  async getExistingToken(key: TKey) {
    const existingToken = await this.existingTokenFetcher(key);

    if (existingToken?.expiresAt) {
      const expiresAt = coalesceDateTime(existingToken.expiresAt);
      if (expiresAt && expiresAt > DateTime.now()) {
        return { ...existingToken, expiresAt } as TToken;
      }
    }

    return null;
  }

  clearToken(key: TKey) {
    this.tokenFetchPromiseMap.delete(key);
  }
}
