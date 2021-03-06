export default {
  transform: {
    "\\.[jt]sx?$": "ts-jest",
  },
  // See https://github.com/facebook/jest/pull/10823.
  // We don't need this with Jest 26 + ts-jest
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",
  },
  rootDir: "./src",
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
