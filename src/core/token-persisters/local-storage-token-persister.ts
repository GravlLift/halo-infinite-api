import { TokenPersister } from ".";

export const localStorageTokenPersister: TokenPersister = {
  load: (tokenName) => {
    const json = localStorage.getItem(tokenName);
    if (json) {
      return JSON.parse(json);
    } else {
      return null;
    }
  },
  save: (tokenName, token) => {
    localStorage.setItem(tokenName, JSON.stringify(token));
  },
};
