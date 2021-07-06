import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  collectCoverageFrom: ["**/*.{ts,tsx,js,jsx}"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/coverage/",
    "/build/",
    "/dina-ui/out/",
    "/babel.config.js",
    "/jest.config.ts",
    "/jest.setup.js",
    "/next.config.js"
  ],
  moduleNameMapper: {
    // Mocks CSS imports to prevent throwing an error during tests.
    "\\.css$": "identity-obj-proxy"
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/.next/", "/node_modules/"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
  transform: {
    "^.+\\.tsx?$": "babel-jest"
  },
  // Transform our local common-ui package
  transformIgnorePatterns: [`/node_modules/(?!common-ui)`]
};

export default config;
