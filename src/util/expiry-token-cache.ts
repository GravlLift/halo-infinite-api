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
    public readonly getExistingToken: () => Promise<
      (Omit<TToken, "expiresAt"> & { expiresAt: unknown }) | null
    >
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
          const newToken = await this.generateNewToken(...args);
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
        const existingToken = await this.getExistingToken();

        if (existingToken?.expiresAt) {
          const expiresAt = coalesceDateTime(existingToken.expiresAt);
          if (expiresAt && expiresAt > DateTime.now()) {
            const newToken = { ...existingToken, expiresAt } as TToken;
            this.tokenFetchPromise.resolve(newToken);
            return newToken;
          }
        }

        const newToken = await this.generateNewToken(...args);
        this.tokenFetchPromise.resolve(newToken);
        return newToken;
      } catch (e) {
        this.tokenFetchPromise.reject(e);
        this.tokenFetchPromise = undefined;
        throw e;
      }
    }
  }
}
