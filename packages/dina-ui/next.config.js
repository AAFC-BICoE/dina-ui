 

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
  transpilePackages: [
    "common-ui",
    "kitsu",
    "react-dnd",
    "react-dnd-html5-backend"
  ],
  output: "export",
  outputFileTracingRoot: path.join(__dirname)
};

module.exports = nextConfig;

 
