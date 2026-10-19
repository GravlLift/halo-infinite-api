import type { TokenPersister } from ".";

function escapeTokenNameForFilesystem(tokenName: string): string {
  return tokenName.replace(/[^a-zA-Z0-9-_]/g, "_");
}

async function getTokenDir(): Promise<string> {
  if (process.env.TOKEN_ROOT) {
    return process.env.TOKEN_ROOT;
  }
  const { join } = await import("path");
  const { homedir } = await import("os");
  return join(homedir(), ".halo-infinite", "tokens");
}

export const nodeFsTokenPersister: TokenPersister = {
  load: async (tokenName) => {
    const tokenDir = await getTokenDir();
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
    const tokenDir = await getTokenDir();
    await (await import("fs/promises")).mkdir(tokenDir, { recursive: true });
    await (
      await import("fs/promises")
    ).writeFile(
      `${tokenDir}/${escapeTokenNameForFilesystem(tokenName)}`,
      JSON.stringify(token)
    );
  },
  clear: async (tokenName) => {
    const tokenDir = await getTokenDir();
    await (
      await import("fs/promises")
    ).unlink(`${tokenDir}/${escapeTokenNameForFilesystem(tokenName)}`);
  },
};
