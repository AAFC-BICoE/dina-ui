const withTypescript = require("@zeit/next-typescript");
const withCss = require("@zeit/next-css");

module.exports = withTypescript(
  withCss({
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
