import { build } from "esbuild";

build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "./dist/index.js",
  platform: "node",
  target: ["es2020"],
  format: "esm",
  sourcemap: true,
});
