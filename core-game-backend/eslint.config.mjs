import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js, prettier },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      // Delegate formatting to Prettier, but run it via ESLint so `eslint --fix` can apply it.
      "prettier/prettier": "error",
    },
  },
]);
