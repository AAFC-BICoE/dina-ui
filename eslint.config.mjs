import globals from "globals";
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";

// Create a clean copy of browser globals
const browserGlobals = {...globals.browser};

// Fix the problematic entry if it exists
if ('AudioWorkletGlobalScope ' in browserGlobals) {
  // Copy the value without the trailing space
  browserGlobals['AudioWorkletGlobalScope'] = browserGlobals['AudioWorkletGlobalScope '];
  // Remove the problematic entry
  delete browserGlobals['AudioWorkletGlobalScope '];
}

const config = tseslint.config(
  // Files to be scanned by the linter.
  {files: ["**/*.{js,ts,jsx,tsx}"]},

  // Ignore built files.
  {ignores: [
    "**/node_modules/",
    "**/out/",
    "**/.next/"
  ]},

  // Supported browsers.
  {languageOptions: { globals: browserGlobals }},

  // Typescript support.
  tseslint.configs.recommended,

  // Prettier rules to be applied (defined in the .prettierrc file).
  eslintConfigPrettier,

  // Changes to the default rules:
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_[^_].*$|^_$",
          "varsIgnorePattern": "^_[^_].*$|^_$",
          "caughtErrorsIgnorePattern": "^_[^_].*$|^_$"
        }
      ]
    }
  }
);

export default config;