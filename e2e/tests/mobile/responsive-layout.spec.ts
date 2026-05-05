import { test, expect } from '../../fixtures'


/**
 * Verifies that the TransactionButton story has no horizontal overflow at
 * iPhone 14 viewport width (390px). Horizontal scroll = layout bug.
 *
 * This project must run under the "mobile" Playwright project so the
 * iPhone 14 viewport is active (390x844).
 */
test('no horizontal overflow on TransactionButton story at mobile viewport', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // Wait for the story content to render.
  await page.locator('button[class*="tx-txb-button"]').first().waitFor({ state: 'visible', timeout: 15_000 })

  const hasOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth > window.innerWidth
  ))

  expect(hasOverflow).toBe(false)
})
