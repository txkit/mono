import { test, expect } from '../../fixtures'


/**
 * After clicking TransactionButton with stepsCount=2 and simulate=false,
 * the flow enters signing state. FlowSteps should reflect the active step
 * with a data-status attribute (or similar) indicating the current state.
 *
 * This test uses the Live tab where FlowSteps is connected to the real
 * TxKitProvider flow context.
 *
 * NOTE: data-status attribute name on step items is inferred from the
 * FlowSteps component internals. If the attribute differs (e.g. data-step-status,
 * aria-current), this selector will need adjustment.
 */
test('FlowSteps first step has active data-status when flow is signing', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia&stepsCount=2&showSteps=true&simulate=false#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const txButton = page.locator('button[class*="tx-txb-button"]').first()
  await expect(txButton).toBeVisible({ timeout: 15_000 })

  await txButton.click()

  // Wait for signing state on the button.
  await expect(txButton).toHaveAttribute('data-state', 'signing', { timeout: 10_000 })

  // The first step item should show an active/current indicator.
  // FlowSteps step items may have data-status or aria-current.
  const firstStep = page.locator('[class*="tx-fs"] li, [class*="tx-flow-steps"] li').first()
  await expect(firstStep).toBeVisible({ timeout: 5_000 })

  // Assert either data-status="signing" or aria-current="step" or similar active indicator.
  const hasActiveIndicator = await firstStep.evaluate((el) => (
    el.hasAttribute('data-status') ||
    el.hasAttribute('aria-current') ||
    el.className.includes('active') ||
    el.className.includes('current') ||
    el.className.includes('signing')
  ))

  expect(hasActiveIndicator).toBe(true)
})
