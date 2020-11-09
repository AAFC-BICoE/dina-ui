// SSR polyfills:
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

// Next.js plugins:
const withTM = require("next-transpile-modules")(["common-ui"]);

module.exports = withTM({
  webpack: (config) => {
    // Enable setImmediate polyfill:
    config.node.setImmediate = true;
    return config;
  },
});
