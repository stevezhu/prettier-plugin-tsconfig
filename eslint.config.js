import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/'],
  },
  js.configs.recommended,
  // typescript config
  {
    name: 'typescript/languageOptions',
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{cjs,js}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    name: 'ts/config-file-globals',
    files: ['*.config.{cjs,js,ts}', 'scripts/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // vitest config
  vitest.configs.recommended,
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/prefer-lowercase-title': [
        'warn',
        { ignoreTopLevelDescribe: true },
      ],
    },
  },
  prettier,
);
