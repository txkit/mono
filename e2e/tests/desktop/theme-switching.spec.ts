import { test, expect } from '../../fixtures'


/**
 * Verifies that clicking the "dark" theme button in the playground toolbar
 * applies the dark theme class to the root container.
 *
 * The PlaygroundToolbar renders buttons for light/dark/auto themes.
 * Clicking "dark" should add tx-dark class to the txkit root wrapper.
 */
test('clicking dark theme button applies tx-dark class to root container', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/#transactionbutton')

  // Click the "light" button first to establish a known baseline.
  await page.locator('.playground-toolbar-btn', { hasText: 'light' }).click()

  // Root component wrapper should have tx-light.
  const root = page.locator('.tx-root').first()
  await expect(root).toHaveClass(/tx-light/, { timeout: 5_000 })

  // Click dark.
  await page.locator('.playground-toolbar-btn', { hasText: 'dark' }).click()

  await expect(root).toHaveClass(/tx-dark/, { timeout: 5_000 })
  await expect(root).not.toHaveClass(/tx-light/)
})
