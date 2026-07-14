import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  collectCoverageFrom: ["**/*.{ts,tsx,js,jsx}"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/coverage/",
    "/build/",
    "/common-ui/types/",
    "/dina-ui/out/",
    "/dina-ui/intl",
    "/jest.config.ts",
    "/jest.setup.js",
    "/next.config.js",
    "index.ts",
    "types.ts",
    "next-env.d.ts",
    "pdfjs-dist/build/pdf.worker.min.mjs"
  ],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Mocks CSS/SCSS imports to prevent throwing an error during tests.
    "\\.css$": "identity-obj-proxy",
    "\\.scss$": "identity-obj-proxy",
    "^react-pdf$": "<rootDir>/__mocks__/empty.js",
    "^pdfjs-dist/legacy/build/pdf\\.worker\\.min\\.mjs$":
      "<rootDir>/__mocks__/empty.js",
    "^@dina-ui/(.*)$": "<rootDir>/packages/dina-ui/$1",
    "^common-ui$": "<rootDir>/packages/common-ui/lib/index.ts"
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/.next/", "/node_modules/"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
  transform: {
    "^.+\\.tsx?$": ["babel-jest", { presets: ["next/babel"] }],
    "^.+\\.js?$": ["babel-jest", { presets: ["next/babel"] }],
    "\\.mjs?$": ["babel-jest", { presets: ["next/babel"] }]
  },
  transformIgnorePatterns: [`/node_modules/(?!common-ui|axios|dnd-core|uuid)`],
  globalSetup: "./jest-global-setup.js"
};

export default config;
