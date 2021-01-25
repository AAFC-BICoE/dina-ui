// SSR polyfills:
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

// Next.js plugins:
const withTM = require("next-transpile-modules")(["common-ui"]);

const isDevMode = process.env.NODE_ENV === "development";
const appVersion = `${require("./package.json").version}${
  isDevMode ? "-DEVELOPMENT" : ""
}`;

module.exports = withTM({
  env: { UI_APP_VERSION: appVersion },
  webpack: (config) => {
    // Enable setImmediate polyfill:
    config.node.setImmediate = true;
    return config;
  },
});
