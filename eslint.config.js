import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Feature-Sliced Design: a layer may import only from layers below it.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

// Slices are consumed through their public API (index.ts) only.
const publicApiPatterns = [
  {
    group: ['@/pages/*/*', '@/widgets/*/*', '@/features/*/*', '@/entities/*/*', '@/shared/*/*'],
    message: 'Import from the slice public API (index.ts) instead.',
  },
]

const layerBoundaries = LAYERS.map((layer, index) => {
  const higherLayers = LAYERS.slice(0, index)
  return {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...publicApiPatterns,
            ...(higherLayers.length > 0
              ? [
                  {
                    group: higherLayers.flatMap((higher) => [`@/${higher}`, `@/${higher}/*`]),
                    message: `"${layer}" must not import from higher FSD layers (${higherLayers.join(', ')}).`,
                  },
                ]
              : []),
          ],
        },
      ],
    },
  }
})

export default defineConfig([
  globalIgnores(['dist', 'dist-e2e', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/shared/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['e2e/**/*.ts', '*.config.{ts,js}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  ...layerBoundaries,
  {
    // Shared test helpers build typed fixtures from entity types.
    files: ['src/shared/test/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: publicApiPatterns }],
    },
  },
  prettierRecommended,
])
