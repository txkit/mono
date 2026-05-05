import { test, expect } from '../../fixtures'


/**
 * When ?safetyDelayMs=5000, clicking the button should enter the
 * "confirming-risk" state and show a visible countdown timer before
 * proceeding to signing.
 */
// TODO: confirming-risk state requires successful eth_call simulation against
// a funded address. Real Sepolia public RPC reverts on the test wallet (no
// ETH); needs page.route() mock for eth_call OR funded fixture address.
test.skip('safety delay shows confirming-risk state with countdown', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia&safetyDelayMs=5000#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()
  await expect(button).toBeVisible({ timeout: 15_000 })

  await button.click()

  // Simulation runs against real Sepolia public RPC; on safetyDelayMs > 0,
  // a successful simulation lands in confirming-risk before signing.
  await expect(button).toHaveAttribute('data-state', 'confirming-risk', { timeout: 30_000 })

  // <span class="tx-txb-countdown"> shows remaining seconds while ticking.
  await expect(page.locator('.tx-txb-countdown').first()).toBeVisible({ timeout: 5_000 })
})
