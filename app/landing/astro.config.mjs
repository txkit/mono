import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'

import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs'


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
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    remarkPlugins: [ remarkReadingTime ],
  },
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
