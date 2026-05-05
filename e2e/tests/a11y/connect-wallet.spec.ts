import { test, expect } from '../../fixtures'


/**
 * a11y baseline for ConnectWallet. Runs axe against WCAG 2.1 A + AA rules
 * after the component renders in its connected state.
 */
test('ConnectWallet has no WCAG 2.1 A/AA violations on connected state', async ({ page, wallet, a11y }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#connectwallet')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // Wait for connected state.
  await expect(page.locator('button[class*="tx-cw-button"]').first())
    .toHaveAttribute('data-state', 'connected', { timeout: 15_000 })

  const results = await a11y.scan({ include: '.story-live-preview-inner' })
  expect(results.violations).toEqual([])
})


test('TransactionButton has no WCAG 2.1 A/AA violations on initial render', async ({ page, wallet, a11y }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  await expect(page.locator('button[class*="tx-txb-button"]').first())
    .toBeVisible({ timeout: 15_000 })

  const results = await a11y.scan({ include: '.story-live-preview-inner' })
  expect(results.violations).toEqual([])
})
