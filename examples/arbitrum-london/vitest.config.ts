import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'


/**
 * Component tests run in jsdom and reuse the app's `@/*` path alias so a
 * spec can import `@/src/...` exactly like the components do. The React SWC
 * plugin owns the JSX transform here: the app tsconfig keeps jsx: "preserve"
 * for Next, which the test transform must not inherit.
 */
export default defineConfig({
  plugins: [ react() ],
  test: {
    environment: 'jsdom',
    include: [ 'src/**/*.spec.{ts,tsx}' ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
