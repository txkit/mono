import { test, expect } from '../../fixtures'


/**
 * WCAG 2.5.5: all interactive elements must have a minimum touch target of 44px.
 * Verifies that the TransactionButton main button meets this requirement at
 * iPhone 14 viewport.
 */
test('TransactionButton touch target height is at least 44px (WCAG 2.5.5)', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()
  await expect(button).toBeVisible({ timeout: 15_000 })

  const box = await button.boundingBox()

  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})
