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
    // Mismo alcance que eslint-config-next: las reglas react-hooks/* solo
    // existen donde ese config registra el plugin (excluye p. ej. *.cjs).
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: projectStyleRules,
  },
  {
    // Scripts Node en CommonJS: require() es el mecanismo de import válido.
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
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
