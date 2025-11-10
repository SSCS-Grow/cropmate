// eslint.config.mjs - Flat config til ESLint v9 + TypeScript + React + Next
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
  // Ignorer build/output
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
      'coverage/**',
      'supabase/.temp/**',
    ],
  },

  // TypeScript/React regler for .ts/.tsx
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // Sæt til true hvis du vil have strengere type-aware rules:
        // project: ['./tsconfig.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      // TS basis
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',

      // React
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      ...reactHooks.configs.recommended.rules,

      // Next.js anbefalinger
      ...nextPlugin.configs.recommended.rules,

      // Console: tillad kun info/warn (matcher dine tidligere fejl)
      'no-console': ['error', { allow: ['warn', 'info'] }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Tillad almindelig JS også (f.eks. scripts)
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
];
