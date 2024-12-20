module.exports = {
  root: true,
  extends: [
    "prettier", // "eslint-config-prettier"
    // "eslint:recommended"
    // "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended", // eslint-plugin-react-hooks
  ],
  parser: "@typescript-eslint/parser", // "@typescript-eslint/parser"
  // https://eslint.org/blog/2024/05/eslint-compatibility-utilities/
  // @eslint/compat
  plugins: [
    "prettier", // "eslint-plugin-prettier"
    "@typescript-eslint", // "@typescript-eslint/eslint-plugin"
    // "react-refresh", // "eslint-plugin-react-refresh": "^0.4.12",
    "react-hooks", // eslint-plugin-react-hooks
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    // https://github.com/Chatie/eslint-config/issues/45#issuecomment-885507652
    // eslint error 'NodeJS' is not defined no-undef
    NodeJS: true,
  },
  parserOptions: {
    // ecmaVersion: 8,
    // requireConfigFile: false,
    // requireConfigFile: true,
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
      impliedStrict: true,
      classes: true,
    },
  },
  rules: {
    "no-undef": "off",
    // "no-console": "warn",
    "no-console": "off", // Disable console warnings for this workspace
    // "prettier/prettier": "error", // Means error
    // ESLint rule for JavaScript
    // "no-unused-vars": "off", // Disable the base rule as TypeScript will handle it
    // TypeScript rule for detecting unused variables
    "@typescript-eslint/no-unused-vars": [
      "warn", // or "error" to enforce it strictly
      {
        vars: "all", // Check for all variables
        args: "after-used", // Check function arguments (ignore the rest parameter)
        ignoreRestSiblings: false, // Ignore variables used in rest destructuring
        varsIgnorePattern: "^_", // Ignore variables starting with an underscore
        argsIgnorePattern: "^_", // Ignore function arguments starting with an underscore
      },
    ],
    // "react-hooks/rules-of-hooks": "error",
    "react-hooks/rules-of-hooks": "warn",
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        additionalHooks:
          "(useBeforeRender|useIsomorphicLayoutEffect|useRecoilCallback|useRecoilTransaction_UNSTABLE)",
      },
    ],
  },
  ignorePatterns: ["node_modules", "dist", "build"],
};
