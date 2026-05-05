import { test, expect } from '../../fixtures'


/**
 * Verifies that FlowSteps renders the correct number of list items when
 * ?stepsCount=3&showSteps=true is passed to the TransactionButton story.
 */
// TODO: FlowSteps reads from FlowStore via context and only renders after
// the flow becomes active (post-click). Initial idle render returns undefined
// per FlowSteps.tsx `if (!flowEntry) return undefined`. Need to either trigger
// the flow OR test against a story preset that pre-registers a flow at mount.
test.skip('FlowSteps renders 3 items when stepsCount=3', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia&stepsCount=3&showSteps=true#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // Wait for the TransactionButton to mount (its useTransactionFlow registers
  // the flow in TxKitProvider; FlowSteps reads from context and renders only
  // after flow registration).
  await expect(page.locator('button[class*="tx-txb-button"]').first())
    .toBeVisible({ timeout: 15_000 })

  // FlowStepsDefault renders <ol class="tx-fs-list"> with <li class="tx-fs-item">.
  await expect(page.locator('.tx-fs-list .tx-fs-item')).toHaveCount(3, { timeout: 15_000 })
})
