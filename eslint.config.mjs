import globals from "globals";
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";

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
  {languageOptions: { globals: globals.browser }},

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
        "warn",
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