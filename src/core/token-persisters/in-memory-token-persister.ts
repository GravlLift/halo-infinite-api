import { TokenPersister } from ".";

const tokens = new Map<string, any>();

export const inMemoryTokenPersister: TokenPersister = {
  load: (tokenName) => {
    return tokens.get(tokenName);
  },
  save: (tokenName, token) => {
    tokens.set(tokenName, token);
  },
  clear: (tokenName) => {
    tokens.delete(tokenName);
  },
};
