import { inMemoryTokenPersister } from "./in-memory-token-persister";
import { nodeFsTokenPersister } from "./node-fs-token-persister";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Node only tests

describe("inMemoryTokenPersister", () => {
  test("save and load", () => {
    inMemoryTokenPersister.clear("t1");
    expect(inMemoryTokenPersister.load("t1")).toBeUndefined();
    inMemoryTokenPersister.save("t1", { a: 1 });
    expect(inMemoryTokenPersister.load("t1")).toEqual({ a: 1 });
  });
  test("clear removes token", () => {
    inMemoryTokenPersister.save("t2", { b: 2 });
    inMemoryTokenPersister.clear("t2");
    expect(inMemoryTokenPersister.load("t2")).toBeUndefined();
  });
});

describe("nodeFsTokenPersister", () => {
  let dir: string;
  const prev = process.env.TOKEN_ROOT;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "hitokens-"));
    process.env.TOKEN_ROOT = dir;
  });
  afterEach(() => {
    process.env.TOKEN_ROOT = prev;
    rmSync(dir, { recursive: true, force: true });
  });
  test("save persists to disk and load reads it", async () => {
    await nodeFsTokenPersister.save("diskToken", { x: 42 });
    const loaded = await nodeFsTokenPersister.load("diskToken");
    expect(loaded).toEqual({ x: 42 });
  });
  test("load returns null for missing", async () => {
    const loaded = await nodeFsTokenPersister.load("missing");
    expect(loaded).toBeNull();
  });
  test("clear removes token file", async () => {
    await nodeFsTokenPersister.save("abc", { z: 9 });
    await nodeFsTokenPersister.clear("abc");
    const loaded = await nodeFsTokenPersister.load("abc");
    expect(loaded).toBeNull();
  });
});
