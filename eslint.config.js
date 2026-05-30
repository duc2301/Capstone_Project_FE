import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Thứ tự tầng FSD (cao → thấp): app → pages → widgets → features → entities → shared.
 * Mỗi tầng chỉ được import từ các tầng THẤP hơn, và chỉ qua public API (index.ts).
 */
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      boundaries,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      // Để boundaries hiểu alias '@/...' qua tsconfig paths.
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      // main.tsx là điểm bootstrap, được phép import mọi thứ.
      'boundaries/ignore': ['src/main.tsx', 'src/vite-env.d.ts'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', mode: 'folder' },
        { type: 'pages', pattern: 'src/pages/*', mode: 'folder', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', mode: 'folder', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', mode: 'folder', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', mode: 'folder', capture: ['slice'] },
        // lib/* phải đứng trước shared/* để bắt đúng segment lồng nhau.
        { type: 'shared', pattern: 'src/shared/lib/*', mode: 'folder', capture: ['segment'] },
        { type: 'shared', pattern: 'src/shared/*', mode: 'folder', capture: ['segment'] },
      ],
    },
    rules: {
      /**
       * Một rule duy nhất ép cả hai luật cốt lõi của FSD:
       *  - Import một chiều: mỗi tầng chỉ import được các tầng thấp hơn.
       *  - Public API: chỉ import slice/segment qua index.ts (internalPath), cấm thò vào trong.
       * Import nội bộ trong cùng một slice được bỏ qua (checkInternals mặc định = false).
       */
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Vi phạm ranh giới FSD: import sai tầng hoặc không đi qua public API (index.ts).',
          rules: [
            { from: { type: 'app' }, allow: { to: { type: ['pages', 'widgets', 'features', 'entities', 'shared'], internalPath: 'index.{ts,tsx}' } } },
            { from: { type: 'pages' }, allow: { to: { type: ['widgets', 'features', 'entities', 'shared'], internalPath: 'index.{ts,tsx}' } } },
            { from: { type: 'widgets' }, allow: { to: { type: ['features', 'entities', 'shared'], internalPath: 'index.{ts,tsx}' } } },
            { from: { type: 'features' }, allow: { to: { type: ['entities', 'shared'], internalPath: 'index.{ts,tsx}' } } },
            { from: { type: 'entities' }, allow: { to: { type: ['shared'], internalPath: 'index.{ts,tsx}' } } },
            { from: { type: 'shared' }, allow: { to: { type: ['shared'], internalPath: 'index.{ts,tsx}' } } },
          ],
        },
      ],
    },
  },
])
