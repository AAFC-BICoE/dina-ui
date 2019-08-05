const withCss = require("@zeit/next-css");
const withTM = require("next-transpile-modules");

module.exports = withCss(
  withTM({
    transpileModules: ["kitsu", "kitsu-core"],
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
  })
);
