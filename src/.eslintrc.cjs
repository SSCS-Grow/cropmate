/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  parserOptions: { tsconfigRootDir: __dirname },
  rules: {
    // ✅ gør “any” til warning (men build er allerede sat op til at ignorere lint)
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'react-hooks/exhaustive-deps': 'warn',
    '@next/next/no-img-element': 'warn'
  }
};
