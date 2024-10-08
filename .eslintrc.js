module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    "endOfLine": 0, // Fix for Delete `CR` Pop up Error VS Code

    // TypeScript specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'error', // Enforce error for unused variables

    // Prettier rules for clean code
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        tabWidth: 2,
        semi: true,
        bracketSpacing: true,
        printWidth: 80,
        arrowParens: 'always',
      },
    ],

    // Additional clean code rules
    'no-console': 'error', // Disallow console.log, but allow console.warn and console.error
    'no-var': 'error', // Enforce let/const instead of var
    'prefer-const': 'error', // Suggest using const if variables are not reassigned
    'no-multi-spaces': 'error', // Disallow multiple spaces
    'eqeqeq': ['error', 'always'], // Enforce === and !== over == and !=
    'curly': ['error', 'all'], // Enforce consistent use of curly braces for blocks
    'complexity': ['error', { max: 10 }], // Warn if functions become too complex
    'max-lines-per-function': ['error', { max: 50 }], // Warn if a function exceeds 50 lines
    'no-duplicate-imports': 'error', // Disallow duplicate imports
    'prefer-template': 'error', // Enforce template literals instead of string concatenation
    'no-underscore-dangle': 'off', // Allow variables or properties to start with an underscore
    'object-shorthand': ['error', 'always'], // Enforce use of object shorthand
    'arrow-body-style': ['error', 'as-needed'], // Enforce consistent use of arrow function body style
  },
};
