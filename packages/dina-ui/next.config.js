// SSR polyfills:
require("setimmediate");
const path = require("path");

// Next.js plugins:
const withTM = require("next-transpile-modules")(["common-ui", "kitsu"]);

const isDevMode = process.env.NODE_ENV === "development";
const appVersion = `${require("./package.json").version}${
  isDevMode ? "-DEVELOPMENT" : ""
}`;

module.exports = withTM({
  env: { UI_APP_VERSION: appVersion },
  experimental: {
    outputStandalone: true,
    // this includes files from the monorepo base two directories up
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
});
