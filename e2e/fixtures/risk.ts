import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const RISK_FIXTURES_DIR = path.join(__dirname, 'risk')


// URL patterns that match real risk-provider APIs. Tests that opt into
// `risk.use(...)` get every matching outbound request fulfilled with the
// fixture payload instead of hitting the live API.
const PROVIDER_PATTERNS: Record<string, string> = {
  blowfish: '**/api.blowfish.xyz/**',
  blockaid: '**/api.blockaid.io/**',
  goplus: '**/api.gopluslabs.io/**',
}


export type RiskFixture =
  | 'blowfish-safe'
  | 'blowfish-warn-token-drain'
  | 'blowfish-block-malicious'
  | 'blockaid-phishing-domain'
  | 'goplus-honeypot'

export type RiskMock = {
  use: (fixture: RiskFixture) => Promise<void>
  reset: () => Promise<void>
}


const detectProvider = (fixture: RiskFixture): string => {
  const provider = fixture.split('-')[0]

  if (!PROVIDER_PATTERNS[provider]) {
    throw new Error(`Unknown risk provider for fixture ${fixture}`)
  }

  return provider
}

const loadFixture = (fixture: RiskFixture): unknown => {
  const filePath = path.join(RISK_FIXTURES_DIR, `${fixture}.json`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Risk fixture not found: ${filePath}`)
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}


/**
 * Risk-provider mock fixture. Tests that need to assert behavior on
 * Blowfish/Blockaid/GoPlus responses register a fixture before the
 * `transaction-button-main` click; matching outbound requests get
 * intercepted at the network layer (no upstream call made).
 */
export const mockRiskProvider = ({ page }: { page: Page }): RiskMock => {
  let activeRoute: string | null = null

  return {
    use: async (fixture: RiskFixture) => {
      const provider = detectProvider(fixture)
      const pattern = PROVIDER_PATTERNS[provider]
      const payload = loadFixture(fixture)

      if (activeRoute) {
        await page.unroute(activeRoute)
      }

      await page.route(pattern, (route) => (
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        })
      ))

      activeRoute = pattern
    },

    reset: async () => {
      if (activeRoute) {
        await page.unroute(activeRoute)
        activeRoute = null
      }
    },
  }
}
