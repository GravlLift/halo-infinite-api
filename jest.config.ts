const config: import("jest").Config = {
  displayName: "halo-infinite-api",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: "node",
  testTimeout: 60000,
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      tsconfig: "tsconfig.spec.json",
      useESM: true
    }]
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};

export default config;
