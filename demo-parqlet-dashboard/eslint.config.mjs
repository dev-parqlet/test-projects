import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, not ours to reformat. ParqletDemo.jsx is kept
    // byte-identical to the file it was authored in so a newer version can
    // be dropped straight over it; linting it to this project's rules
    // would mean either a diff on every drop or a permanently red `npm run
    // lint`. It is checked by the compiler and by the build like any other
    // file - only the style rules are off.
    "app/components/demo/ParqletDemo.jsx",
  ]),
]);

export default eslintConfig;
