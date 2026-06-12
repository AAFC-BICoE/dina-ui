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
    return config;
  }
};

module.exports = nextConfig;
