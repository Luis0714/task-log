import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const projectStyleRules = {
  semi: ["error", "always"],
  quotes: [
    "error",
    "double",
    { avoidEscape: true, allowTemplateLiterals: true },
  ],
  "comma-dangle": ["error", "always-multiline"],
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-var": "error",
  "prefer-const": "error",
  "object-shorthand": "error",
  "prefer-template": "warn",
  "no-console": ["warn", { allow: ["warn", "error"] }],

  // Patrones habituales en sheets/hooks (sincronizar props → estado local).
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/refs": "warn",

  "@typescript-eslint/no-unused-vars": "off",
  "no-unused-vars": "off",
  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": [
    "warn",
    {
      vars: "all",
      varsIgnorePattern: "^_",
      args: "after-used",
      argsIgnorePattern: "^_",
      caughtErrors: "all",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
      disallowTypeAnnotations: false,
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: projectStyleRules,
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "eslint.config.mjs",
    "knip.json",
  ]),
]);

export default eslintConfig;
