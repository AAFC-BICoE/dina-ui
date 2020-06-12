module.exports = {
  collectCoverageFrom: ["**/*.{ts,tsx,js,jsx}"],
  coveragePathIgnorePatterns: [
    "/coverage/",
    "/build/",
    "/out/",
    "babel.config.js",
    "jest.config.js",
    "jest.setup.js",
    "next.config.js",
    "polyfills.js"
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
  transformIgnorePatterns: [`/node_modules/(?!common-ui)`],
  snapshotSerializers: ["enzyme-to-json/serializer"]
};
