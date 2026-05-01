// Flat ESLint config for the txKit monorepo. Encodes the style rules
// from `mono/CLAUDE.md` so future regressions are caught automatically
// instead of through manual review.
//
// Intentionally NOT covered (audit handles them in batches because
// they are judgment calls):
// - Import "лесенка" length ordering (cosmetic)
// - JSDoc presence on public types (sensitivity-context dependent)
// - File / folder naming conventions (covered by folder-per-component
//   structural rule, not lint-able)

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'


export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/coverage/**',
      'app/docs/.vitepress/cache/**',
      'app/docs/.vocs/**',
      'app/story/dist/**',
      'pnpm-lock.yaml',
      '**/*.js',
      '**/*.cjs',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // react-hooks 7+ added several strict experimental rules. Tune
      // them per project policy:

      // `set-state-in-effect` flags legitimate patterns (cleanup-after-
      // mount guards, timer reset on prop change). Surface as warn.
      'react-hooks/set-state-in-effect': 'warn',

      // `refs` flags direct ref.current assignment in render, but
      // mono/CLAUDE.md explicitly endorses this pattern for callback
      // prop sync without useEffect overhead:
      //   "Direct ref assignment в render: onErrorRef.current = onError.
      //    НЕ useEffect - overhead без пользы"
      // Disable - we know what we're doing.
      'react-hooks/refs': 'off',

      // React Compiler integration warns when manual useMemo/useCallback
      // can't be preserved through compilation. We are not using the
      // React Compiler yet, so downgrade to warn.
      'react-hooks/preserve-manual-memoization': 'warn',

      // Same: hook factory check is React Compiler-aware. Warn until we
      // adopt the compiler in v0.2.
      'react-hooks/component-hook-factories': 'warn',
    },
  },

  // Project rules from mono/CLAUDE.md
  {
    rules: {
      // Always braces - "Однострочные if запрещены"
      curly: [ 'error', 'all' ],

      // Strict equality
      eqeqeq: [ 'error', 'always' ],

      // Prefer const + ban var
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',

      // No nested ternaries - "Нет двойных тернарников"
      'no-nested-ternary': 'error',

      // Disallow `setIsXxx` setter naming. State variable can keep
      // isXxx form (boolean naming convention), only the setter loses
      // the prefix.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ArrayPattern > Identifier[name=/^setIs[A-Z]/]',
          message: 'Setter must drop the "Is" prefix (e.g. setMounting, not setIsMounting). State variable can keep isXxx.',
        },
      ],

      // Bracket spacing inside arrays per CLAUDE.md: "Пробелы в скобках:
      // [ item ] и { key: value } когда содержимое есть"
      'array-bracket-spacing': [ 'error', 'always', { objectsInArrays: false, arraysInArrays: false }],

      // Unused variables - allow `_` prefix for intentional
      '@typescript-eslint/no-unused-vars': [ 'error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // Tame TS recommended noise without losing teeth
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-namespace': 'off',  // we use TxKit namespace
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': false },
      ],

      // No abbreviated identifiers - "Нет сокращённых переменных"
      // Min length 2 with whitelist for common cases
      'id-length': [
        'warn',
        {
          min: 2,
          properties: 'never',
          exceptions: [ '_', 'a', 'b' ],  // a/b for sort comparators
        },
      ],
    },
  },

  // Test files: relax rules
  {
    files: [ '**/*.spec.ts', '**/*.spec.tsx', '**/test-setup.ts' ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'id-length': 'off',
    },
  },

  // Story playground: relax id-length (UI examples often use short vars)
  {
    files: [ 'app/story/**/*.{ts,tsx}' ],
    rules: {
      'id-length': 'off',
    },
  },
)
