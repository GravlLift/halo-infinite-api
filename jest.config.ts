const config: import("jest").Config = {
  displayName: "halo-infinite-api",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 60000,
};

export default config;
