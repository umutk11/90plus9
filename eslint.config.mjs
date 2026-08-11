import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

const javascriptFiles = ["scripts/**/*.{js,mjs,cjs}"];
const typescriptFiles = ["packages/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}"];
const lintedFiles = [...javascriptFiles, ...typescriptFiles];

export default [
  {
    ignores: [
      "**/.next/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "apps/web/**",
      "packages/database/src/generated/**",
    ],
  },
  {
    ...eslint.configs.recommended,
    files: lintedFiles,
    languageOptions: {
      globals: {
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
      },
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: lintedFiles,
  })),
  {
    files: typescriptFiles,
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": "error",
    },
  },
  prettier,
];
