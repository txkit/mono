import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.css', 'src/base.css', 'src/dark.css'],
  outDir: 'dist',
})
