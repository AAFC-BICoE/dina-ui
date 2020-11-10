// Top-level jest config used by the tests in the "scripts" folder:
module.exports = {
  collectCoverageFrom: ["**/*.{ts,tsx,js,jsx}"],
  coveragePathIgnorePatterns: [
    "/coverage/",
    "babel.config.js",
    "jest.config.js",
  ],
  moduleNameMapper: {
    // Mocks CSS imports to prevent throwing an error during tests.
    "\\.css$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: ["/node_modules/"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
