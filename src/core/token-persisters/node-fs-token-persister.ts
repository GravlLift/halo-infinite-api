import type { TokenPersister } from ".";

function escapeTokenNameForFilesystem(tokenName: string): string {
  return tokenName.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export const nodeFsTokenPersister: TokenPersister = {
  load: async (tokenName) => {
    const tokenDir =
      process.env.TOKEN_ROOT ||
      (await import("path")).join(import.meta.dirname, "./tokens");
    try {
      const json = await (
        await import("fs/promises")
      ).readFile(`${tokenDir}/${escapeTokenNameForFilesystem(tokenName)}`, {
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
      (await import("path")).join(import.meta.dirname, "./tokens");
    await (await import("fs/promises")).mkdir(tokenDir, { recursive: true });
    await (
      await import("fs/promises")
    ).writeFile(
      `${tokenDir}/${escapeTokenNameForFilesystem(tokenName)}`,
      JSON.stringify(token)
    );
  },
  clear: async (tokenName) => {
    const tokenDir =
      process.env.TOKEN_ROOT ||
      (await import("path")).join(import.meta.dirname, "./tokens");
    await (
      await import("fs/promises")
    ).unlink(`${tokenDir}/${escapeTokenNameForFilesystem(tokenName)}`);
  },
};
