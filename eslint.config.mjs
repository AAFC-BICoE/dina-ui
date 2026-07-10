import path from "path";
import { fileURLToPath } from "url";
import globals from "globals";
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";
import jest from "eslint-plugin-jest";
import nextPlugin from "@next/eslint-plugin-next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const browserGlobals = { ...globals.browser };

// Fix the problematic entry if it exists
if ('AudioWorkletGlobalScope' in browserGlobals) {
  delete browserGlobals['AudioWorkletGlobalScope'];
}

const config = [
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      globals: browserGlobals,
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@next/next': nextPlugin,
      jest: jest
    },
    rules: {
      // Core TypeScript & Next.js rules
      ...tseslint.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Custom overrides
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
      ],

      "react-hooks/exhaustive-deps": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "import/no-anonymous-default-export": "off",
      "react/jsx-key": "off",

      // Prettier formatting conflict overrides
      ...eslintConfigPrettier.rules,
    },
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },
  {
    ignores: [
      "**/node_modules/",
      "**/out/",
      "**/.next/",
      "**/next-env.d.ts"
    ],
  }
];

export default config;