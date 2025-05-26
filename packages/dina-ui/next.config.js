/* eslint-disable @typescript-eslint/no-require-imports */

// SSR polyfills:
require("setimmediate");
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

// Next.js plugins:
const withTM = require("next-transpile-modules")(["common-ui", "kitsu"]);

const isDevMode = process.env.NODE_ENV === "development";
const appVersion = `${require("./package.json").version}${
  isDevMode ? "-DEVELOPMENT" : ""
}`;

module.exports = withTM({
  env: { UI_APP_VERSION: appVersion },
  webpack: (config) => {
    config.resolve.alias.canvas = false;

    return config;
  },
  swcMinify: false
});

/* eslint-enable @typescript-eslint/no-require-imports */
