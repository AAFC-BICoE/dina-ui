// SSR polyfills:
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

// Next.js plugins:
const withTM = require("next-transpile-modules");

module.exports = withTM({
  transpileModules: ["common-ui"],
});
