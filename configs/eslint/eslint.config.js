// ESLint configuration for TypeScript-only codebase
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-implicit-any-catch': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      
      // Code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      
      // Style rules
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error'
    }
  },
  {
    // Disable some rules for configuration files
    files: ['**/*.config.js', '**/eslint.config.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off'
    }
  },
  {
    // Completely ignore JavaScript files (except configs)
    files: ['**/*.js'],
    ignores: ['**/*.config.js', '**/eslint.config.js'],
    rules: {
      // This will cause an error if any non-config JS files exist
      'no-restricted-syntax': ['error', {
        selector: '*',
        message: 'JavaScript files are not allowed. Use TypeScript only.'
      }]
    }
  }
];