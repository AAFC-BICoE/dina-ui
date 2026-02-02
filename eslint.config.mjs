import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";
import globals from "globals";
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";
import jest from "eslint-plugin-jest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const browserGlobals = { ...globals.browser };

// Fix the problematic entry if it exists (note: removed extra space)
if ('AudioWorkletGlobalScope' in browserGlobals) {
  browserGlobals['AudioWorkletGlobalScope'] = browserGlobals['AudioWorkletGlobalScope'];
  delete browserGlobals['AudioWorkletGlobalScope'];
}

const config = [
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      globals: browserGlobals,
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      jest: jest
    },
    rules: {
      ...tseslint.configs.recommended.rules,

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
      "react-hooks/rules-of-hooks": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "import/no-anonymous-default-export": "off",
      "react/jsx-key": "off",

      ...eslintConfigPrettier.rules,
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
