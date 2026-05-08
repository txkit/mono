# @txkit/landing

txKit marketing landing page at [`txkit.dev`](https://txkit.dev).

Stack: Astro 6 (SSG) + React 19 islands + plain CSS with `--txkit-*` tokens.

## Local development

```bash
# From repo root
pnpm install

# Dev server (default http://localhost:4321)
pnpm --filter @txkit/landing dev

# Production build
pnpm --filter @txkit/landing build

# Preview production output
pnpm --filter @txkit/landing preview

# Typecheck (astro check)
pnpm --filter @txkit/landing typecheck

# Bundle size budgets
cd app/landing && pnpm exec size-limit
```

## Project structure

```
app/landing/
├── public/                  Static assets served as-is (favicon, og.svg, robots, llms.txt)
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro     <html>, <head> SEO meta, JSON-LD, fonts
│   ├── components/              Folder-per-component (CLAUDE.md convention)
│   │   ├── Header/
│   │   ├── Hero/
│   │   ├── DecodePreviewSimulate/
│   │   ├── CodeExample/
│   │   ├── DualTrack/
│   │   ├── LogoWall/            React island (uses @web3icons/react)
│   │   ├── Protocol/
│   │   ├── Components/
│   │   ├── HostedVerify/
│   │   ├── Pricing/
│   │   ├── Founder/
│   │   └── Footer/
│   ├── pages/index.astro        Composition root
│   └── styles/global.css        CSS reset + --txkit-* tokens
├── astro.config.mjs
├── tsconfig.json
├── vercel.json                  Vercel build pattern
└── .size-limit.json
```

## Deploy (Vercel)

### Initial setup (one-time)

```bash
# From app/landing/ - assumes Vercel CLI is installed and authenticated
vercel link
# Choose: Mike's team -> create new project "txkit-landing"

# Pull production env (none required for Phase 1, only for SaaS API)
vercel pull --environment=production
```

In the Vercel dashboard:

1. **Build & Development settings** - leave as detected (build command via `vercel.json` overrides framework detection):
   - Build Command: `cd ../.. && pnpm --filter @txkit/landing build`
   - Output Directory: `dist`
   - Install Command: `cd ../.. && pnpm install --frozen-lockfile`
   - Root Directory: `app/landing`
2. **Environment Variables** - none for Phase 1
3. **Domains**:
   - Add apex `txkit.dev`
   - Add `www.txkit.dev` -> redirect to apex
   - DNS records (Cloudflare):
     - `A @ 76.76.21.21` (Vercel apex IP)
     - `CNAME www cname.vercel-dns.com`

### CI/CD

- **Production deploy**: every push to `main` triggers production build
- **Preview deploys**: every PR gets a preview URL `txkit-landing-<branch>.vercel.app`
- Vercel reads `vercel.json` for build config and headers

### Post-deploy checks

```bash
# Verify SSL
curl -I https://txkit.dev

# OG card preview
# - Twitter:   https://cards-dev.twitter.com/validator
# - Discord:   paste the URL into a private channel
# - LinkedIn:  https://www.linkedin.com/post-inspector/

# Lighthouse on prod (requires lighthouse CLI)
lighthouse https://txkit.dev --view --preset=desktop
```

## Conventions

- Plain CSS only - no Tailwind, no CSS-in-JS (CLAUDE.md rule)
- CSS variables prefixed `--txkit-*` to share with the rest of the design system
- Folder-per-component with co-located `.astro` + `.css` (+ `.tsx` for islands)
- Arrow functions, no semicolons, `type` not `interface`, hyphen-minus only
- WCAG 2.1 AA compliance (44px touch targets, `:focus-visible`, `prefers-reduced-motion`)

## Known gaps / Phase 2

- `@astrojs/sitemap` integration disabled - rolldown-vite plugin compat issue.
  Workaround: hand-rolled `public/sitemap.xml`. Update `lastmod` when content
  changes, add new URLs as more pages land.
- Static OG image (`og.svg`). Phase 2: dynamic OG via `@vercel/og` for per-page cards.
- ESLint coverage on `.astro` files requires `eslint-plugin-astro`. Currently only
  lints `.tsx` islands.
- Logo wall: 12 of 16 brands come from `@web3icons/react`; 4 (Morpho, LI.FI, Crossmint,
  x402) render as initial-letter placeholders. Replace when icons are added upstream
  or when we have brand-asset SVGs ready.

## SEO + AI search optimization (Phase 2.5)

Implemented in v0.1:

- `@graph` JSON-LD: Organization + WebSite + SoftwareApplication + FAQPage
- `sameAs` links to GitHub, npm, X
- `softwareVersion`, `programmingLanguage`, `codeRepository`, `license`, `dateModified`
- 5 FAQ entries answering common dev questions (verbatim, AI-citable)
- Anchor IDs on every section: `#hero`, `#how-it-works`, `#example`, `#who-its-for`,
  `#protocol`, `#components`, `#hosted-verification`
- Static `sitemap.xml`, `robots.txt`, `llms.txt`
- Open Graph + Twitter Card with image dimensions
- Canonical URLs, theme-color, color-scheme
- React islands hydrated lazily (`client:visible`) where they sit below the fold

To add for organic traffic (Phase 2.5+):

1. **Comparison pages** at `/vs/rainbowkit`, `/vs/web3modal`, `/vs/thirdweb`,
   `/vs/connectkit`. Use HTML `<table>` for AI citation. Highest cold-traffic ROI.
2. **Use-case landings** at `/for-ai-agents`, `/for-dao-multisig`, `/for-dapp-developers`.
   One ICP, one CTA per page.
3. **Long-tail technical posts** under `/blog/`: "EIP-5792 batch transactions in React",
   "How to decode calldata before signing", "Bounded approvals vs MAX_UINT256".
   1500-2500 words, code-heavy, link to TransactionButton/TxApproval.
4. **Public changelog** at `/changelog` with one URL per release, RSS/Atom feed
   linked from `<head>`. `dateModified` per entry.
5. **Self-host fonts** (Inter + IBM Plex Mono woff2). Removes Google Fonts DNS hop,
   improves LCP and INP.
6. **Per-page dynamic OG images** via `@vercel/og` or satori at build time.
7. **`BreadcrumbList` schema** on subpages once they exist.
8. **Author bylines** with `Person` schema linked to Mike's profiles - E-E-A-T.
9. **Submit to AI-citable directories**: GitHub topic tags, Awesome-Web3 lists,
   Product Hunt. Perplexity/ChatGPT lean heavily on these as authority sources.

Skip: `Product` schema (rejected by Google for software - use `SoftwareApplication.offers`),
heavy investment in `llms.txt` beyond what we have (no engine confirms reading it as of 2026).
