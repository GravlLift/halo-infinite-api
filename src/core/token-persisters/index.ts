export interface TokenPersister {
  load: <T>(tokenName: string) => Promise<T> | T;
  save: (tokenName: string, token: unknown) => Promise<void> | void;
}
