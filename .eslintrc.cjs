/**
 * ESLint Configuration for DisModular.js
 * 
 * @author fkndean_
 * @date 2025-10-19
 */

module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // General rules
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console statements for debugging
    'prefer-const': 'warn',
    'no-var': 'warn',
    
    // Code style
    'indent': ['warn', 2],
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'always-multiline'],
    
    // Best practices
    'eqeqeq': ['warn', 'always'],
    'curly': ['warn', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Additional rules for better CI experience
    'no-case-declarations': 'warn',
    'no-useless-escape': 'warn',
    'no-undef': 'warn',
  },
  overrides: [
    // React/JSX files
    {
      files: ['**/*.jsx', '**/*.js'],
      env: {
        browser: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // Test files
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/tests/**/*.js'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
