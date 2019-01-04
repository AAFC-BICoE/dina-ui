module.exports = {
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
  transform: {
    "^.+\\.tsx?$": "babel-jest"
  },
  testPathIgnorePatterns: ["/.next/", "/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  collectCoverageFrom: ["**/*.{ts,tsx,js,jsx}"],
  coveragePathIgnorePatterns: ["/coverage/", "jest.config.js", "next.config.js"]
};
