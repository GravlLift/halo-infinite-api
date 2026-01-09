import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

// Resolve the main entry for the 'jest' package, then derive its package root
const requireFromHere = createRequire(import.meta.url);
const jestMain = requireFromHere.resolve("jest");

// Walk up to find the package root containing the bin script
let dir = path.dirname(jestMain);
let attempts = 0;
let jestBinPath = "";
while (attempts < 5) {
  const candidate = path.join(dir, "bin", "jest.js");
  if (fs.existsSync(candidate)) {
    jestBinPath = candidate;
    break;
  }
  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
  attempts++;
}

if (!jestBinPath) {
  throw new Error("Unable to locate Jest CLI (bin/jest.js)");
}

// Forward current process.argv to Jest by importing its CLI in the same process
await import(pathToFileURL(jestBinPath).href);
