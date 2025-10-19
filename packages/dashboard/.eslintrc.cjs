/**
 * ESLint Configuration for DisModular.js Dashboard
 * 
 * @author fkndean_
 * @date 2025-10-19
 */

module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
    vitest: true,
  },
  globals: {
    // Browser globals
    alert: 'readonly',
    confirm: 'readonly',
    fetch: 'readonly',
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    navigator: 'readonly',
    URL: 'readonly',
    URLSearchParams: 'readonly',
    Blob: 'readonly',
    FileReader: 'readonly',
    CustomEvent: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',
    setInterval: 'readonly',
    clearInterval: 'readonly',
    HTMLCanvasElement: 'readonly',
    Event: 'readonly',
    // Test globals
    global: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
    expect: 'readonly',
    // Vitest globals
    vi: 'readonly',
    describe: 'readonly',
    it: 'readonly',
    test: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react',
    'react-hooks',
  ],
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
    
    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'warn',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn', // Enable exhaustive deps warnings
    
    // Best practices
    'eqeqeq': ['warn', 'always'],
    'curly': ['warn', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-undef': 'error', // Enable no-undef but rely on env settings
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    // All files - enable no-undef with proper env
    {
      files: ['**/*.js', '**/*.jsx'],
      env: {
        browser: true,
        node: true,
      },
      rules: {
        'no-undef': 'error',
      },
    },
    // Test files
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/tests/**/*.js', '**/tests/**/*.jsx'],
      env: {
        jest: true,
        node: true,
        vitest: true,
      },
      globals: {
        global: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        expect: 'readonly',
        HTMLCanvasElement: 'readonly',
        Event: 'readonly',
        localStorage: 'readonly',
        // Vitest globals
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
      rules: {
        'no-console': 'off',
        'no-undef': 'error',
      },
    },
  ],
};
