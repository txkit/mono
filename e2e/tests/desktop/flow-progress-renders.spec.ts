import { test, expect } from '../../fixtures'


/**
 * Verifies that FlowProgress bar is visible in the Live tab when
 * ?stepsCount=2&showProgress=true is set.
 */
test('FlowProgress bar is visible when showProgress=true', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia&stepsCount=2&showProgress=true#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // FlowProgress renders a progress bar element.
  // It may be a <progress> or a div with role="progressbar".
  const progressBar = page.locator('[role="progressbar"], [class*="tx-fp"], [class*="tx-flow-progress"]').first()

  await expect(progressBar).toBeVisible({ timeout: 15_000 })
})
