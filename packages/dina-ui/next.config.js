// SSR polyfills:
require("setimmediate");
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

const isDevMode = process.env.NODE_ENV === "development";
const appVersion = `${require("./package.json").version}${
  isDevMode ? "-DEVELOPMENT" : ""
}`;

const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["dina.local"],
  env: { UI_APP_VERSION: appVersion },
  transpilePackages: ["common-ui", "kitsu"],
  output: "export",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  turbopack: {
    root: path.join(__dirname, "../..")
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname)
    };

    // Force Webpack to fall back to the root tsconfig path mappings
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      new TsconfigPathsPlugin({
        configFile: path.join(__dirname, "../../tsconfig.json")
      })
    ];

    return config;
  }
};

module.exports = nextConfig;
