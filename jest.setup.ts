import { jest as jestGlobals } from "@jest/globals";
// Provide `jest` global for ESM tests using VM modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as typeof globalThis & { jest: typeof jestGlobals }).jest =
  jestGlobals;
