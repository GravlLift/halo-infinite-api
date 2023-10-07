import fs from "fs/promises";
import { TokenPersister } from ".";

export const nodeFsTokenPersister: TokenPersister = {
  load: async (tokenName) => {
    const storageFileName = `./tokens/${tokenName}`;
    try {
      const json = await fs.readFile(storageFileName, { encoding: "utf-8" });
      return JSON.parse(json);
    } catch (e) {
      if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
        return null;
      } else {
        throw e;
      }
    }
  },
  save: async (tokenName, token) => {
    const storageFileName = `./tokens/${tokenName}`;
    await fs.mkdir(`./tokens/`, { recursive: true });
    await fs.writeFile(storageFileName, JSON.stringify(token));
  },
};
