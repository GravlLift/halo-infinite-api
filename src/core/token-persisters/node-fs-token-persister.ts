import type { TokenPersister } from ".";

export const nodeFsTokenPersister: TokenPersister = {
  load: async (tokenName) => {
    const tokenDir =
      process.env.TOKEN_ROOT ||
      (await import("path")).join(__dirname, "./tokens");
    try {
      const json = await (
        await import("fs/promises")
      ).readFile(`${tokenDir}/${tokenName}`, {
        encoding: "utf-8",
      });
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
    const tokenDir =
      process.env.TOKEN_ROOT ||
      (await import("path")).join(__dirname, "./tokens");
    await (await import("fs/promises")).mkdir(tokenDir, { recursive: true });
    await (
      await import("fs/promises")
    ).writeFile(`${tokenDir}/${tokenName}`, JSON.stringify(token));
  },
};
