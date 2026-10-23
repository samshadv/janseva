export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/coverage/**"
    ]
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-undef": "off"
    }
  }
];
