export interface TokenPersister {
  load: <T>(tokenName: string) => Promise<T | null> | T | null;
  save: (tokenName: string, token: unknown) => Promise<void> | void;
}
