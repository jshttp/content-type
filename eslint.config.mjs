import globals from 'globals';
import js from '@eslint/js';
import markdown from '@eslint/markdown';

export default [
  { ignores: ['coverage/*'] },
  ...markdown.configs.recommended,
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'script',
      globals: globals.node
    },
    rules: js.configs.recommended.rules
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'module',
    },
    rules: js.configs.recommended.rules
  },
];
