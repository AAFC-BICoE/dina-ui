import type { Config } from "@jest/types";

// Always show the "Summary of all failing tests" block whenever more than one
// test suite runs. Jest's default threshold of 20 hid it in CI chunks of ~20 files.
const reporters: NonNullable<Config.InitialOptions["reporters"]> = [
  ["default", { summaryThreshold: 1 }]
];

// Jest's built-in github-actions reporter emits ::error:: annotations (shown on the
// PR checks tab and run Summary page) plus collapsible per-file failure logs, but it
// prints these codes unconditionally, so only enable it on GitHub Actions runners.
if (process.env.GITHUB_ACTIONS === "true") {
  reporters.push("github-actions");
  // appends markdown failure digest (failing tests, messages, and a local rerun command) to the job's Summary page
  reporters.push("<rootDir>/jest-ci-summary-reporter.js");
}

const config: Config.InitialOptions = {
  reporters,
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
    "/jest-ci-summary-reporter.js",
    "/jest-ci-compose-report.js",
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
  setupFilesAfterEnv: ["<rootDir>/jest.setupAfterEnv.js"],
  testPathIgnorePatterns: ["/.next/", "/node_modules/"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
  transform: {
    "^.+\\.tsx?$": ["babel-jest", { presets: [["next/babel", { "preset-react": { runtime: "automatic" } }]] }],
    "^.+\\.js?$": ["babel-jest", { presets: [["next/babel", { "preset-react": { runtime: "automatic" } }]] }],
    "\\.mjs?$": ["babel-jest", { presets: [["next/babel", { "preset-react": { runtime: "automatic" } }]] }]
  },
  transformIgnorePatterns: [
    `/node_modules/(?!common-ui|axios|dnd-core|uuid|dexie)`
  ],
  globalSetup: "./jest-global-setup.js"
};

export default config;
