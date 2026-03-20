import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-namespace': 'off',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'array-bracket-spacing': ['error', 'always', { objectsInArrays: false, arraysInArrays: false }],
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.js', '**/*.cjs'],
  },
)
