// T0.1 placeholder — real shared lint config lands in packages/config.
import tsParser from "@typescript-eslint/parser";
export default [
  { files: ["**/*.ts", "**/*.tsx"], languageOptions: { parser: tsParser }, rules: {} },
];
