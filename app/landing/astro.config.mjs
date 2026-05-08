import { defineConfig } from 'astro/config'
import react from '@astrojs/react'


// Astro config for txKit landing (txkit.dev).
// SSG only - zero adapter, Vercel serves dist/ statically.
// Sitemap integration skipped for now - rolldown-vite plugin compat issue
// with @astrojs/sitemap. Will re-add when Astro 6 + rolldown stabilizes,
// or generate sitemap via static file in public/.

export default defineConfig({
  site: 'https://txkit.dev',
  output: 'static',
  integrations: [
    react(),
  ],
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
  vite: {
    ssr: {
      noExternal: [ 'motion' ],
    },
  },
})
