/* eslint-disable @typescript-eslint/no-require-imports */

// SSR polyfills:
require("setimmediate");
CustomEvent = require("custom-event");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");

const isDevMode = process.env.NODE_ENV === "development";
const appVersion = `${require("./package.json").version}${
  isDevMode ? "-DEVELOPMENT" : ""
}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { UI_APP_VERSION: appVersion },
  transpilePackages: [
    "common-ui",
    "kitsu",
    "react-dnd",
    "react-dnd-html5-backend"
  ]
};

module.exports = nextConfig;

/* eslint-enable @typescript-eslint/no-require-imports */
