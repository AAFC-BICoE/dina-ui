// SSR polyfills:
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

// Next.js plugins:
const withTM = require("next-transpile-modules");

module.exports = withTM({
  env: { UI_APP_VERSION: process.env.UI_APP_VERSION },
  transpileModules: ["common-ui"],
  webpack: (config) => {
    // Enable setImmediate polyfill:
    config.node.setImmediate = true;
    return config;
  },
});
