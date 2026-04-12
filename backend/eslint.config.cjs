module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/**/*.ts'],
  },
  {
    files: ['scripts/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
