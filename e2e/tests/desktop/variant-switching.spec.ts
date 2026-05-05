import { test, expect } from '../../fixtures'


/**
 * Verifies that clicking the "soft" variant button in the playground toolbar
 * applies the tx-soft class to the root container.
 *
 * PlaygroundToolbar renders default/soft/sharp/rounded variant buttons.
 * Clicking "soft" should add tx-soft to the .tx-root wrapper.
 */
test('clicking soft variant button applies tx-soft class to playground wrapper', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/#transactionbutton')

  // Playground wraps story in <div class="tx-color-X tx-{variant}"> when
  // variant !== 'default'. Click soft, the wrapper picks up tx-soft.
  await page.getByRole('button', { name: 'soft', exact: true }).click()

  // The variant wrapper is <div class="tx-color-* tx-soft"> just above
  // TxKitProvider. Match by both color- prefix and the variant class.
  await expect(page.locator('div[class*="tx-color-"][class*="tx-soft"]').first())
    .toBeVisible({ timeout: 5_000 })
})
