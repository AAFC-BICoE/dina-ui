// SSR polyfills:
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

// Next.js plugins:
const withTM = require("next-transpile-modules");

module.exports = withTM({
  transpileModules: ["common-ui"],
  webpack: config => {
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: "empty"
    };

    // Polyfill config start.
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();

      if (
        entries["main.js"] &&
        !entries["main.js"].includes("./polyfills.js")
      ) {
        entries["main.js"].unshift("./polyfills.js");
      }

      return entries;
    };
    // Polyfill config end.

    return config;
  }
});
