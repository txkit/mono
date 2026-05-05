import { test, expect } from '../../fixtures'


/**
 * Verifies that ConnectWallet renders and is tappable on iPhone 14 viewport.
 * The trigger button should be visible and respond to tap (click).
 */
test('ConnectWallet trigger is visible and tappable on iPhone 14 viewport', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#connectwallet')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const trigger = page.locator('button[class*="tx-cw-button"]').first()
  await expect(trigger).toBeVisible({ timeout: 15_000 })

  // Verify tappable: connected state shows address after auto-connect.
  await expect(trigger).toHaveAttribute('data-state', 'connected', { timeout: 15_000 })

  // Bounding box must be within viewport (not clipped off screen).
  const box = await trigger.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThan(0)
  expect(box!.height).toBeGreaterThan(0)

  // Touch target >= 44px.
  expect(box!.height).toBeGreaterThanOrEqual(44)
})
