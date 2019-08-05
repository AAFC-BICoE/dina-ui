module.exports = {
  collectCoverageFrom: ["**/*.{ts,tsx,js,jsx}"],
  coveragePathIgnorePatterns: [
    "/coverage/",
    "/build/",
    // Running tests directly on this script should not be necessary.
    // If the dependency is patched wrong then the postinstall hook or the tests would fail.
    "/scripts/patch-kitsu.ts",
    "jest.config.js",
    "jest.setup.js",
    "next.config.js",
    "polyfills.js"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
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
  snapshotSerializers: ["enzyme-to-json/serializer"]
};
