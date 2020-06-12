module.exports = {
  collectCoverageFrom: ["**/*.{ts,tsx,js,jsx}"],
  coveragePathIgnorePatterns: [
    "/coverage/",
    "babel.config.js",
    "jest.config.js",
    "jest.setup.js"
  ],
  moduleNameMapper: {
    // Mocks CSS imports to prevent throwing an error during tests.
    "\\.css$": "identity-obj-proxy"
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
  transform: {
    "^.+\\.tsx?$": "babel-jest"
  }
};
