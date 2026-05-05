import { test as base, expect } from '@playwright/test'

import { setupWallet, type WalletFixture } from './wallet'
import { mockRiskProvider, type RiskMock } from './risk'
import { setupA11y, type A11yFixture } from './a11y'


type Fixtures = {
  wallet: WalletFixture
  risk: RiskMock
  a11y: A11yFixture
}


/**
 * Extended Playwright test with txKit-specific fixtures.
 *
 * Usage:
 *   import { test, expect } from '../../fixtures'
 *
 *   test('connects', async ({ page, wallet }) => {
 *     await wallet.init({ chain: 'sepolia' })
 *     await page.goto('/')
 *     await wallet.connect()
 *     // assertions...
 *   })
 */
export const test = base.extend<Fixtures>({
  wallet: async ({ page }, use) => {
    const wallet = await setupWallet({ page })
    await use(wallet)
  },
  risk: async ({ page }, use) => {
    const mock = mockRiskProvider({ page })
    await use(mock)
    await mock.reset()
  },
  a11y: async ({ page }, use) => {
    await use(setupA11y({ page }))
  },
})


export { expect }
