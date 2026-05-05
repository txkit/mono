import { test, expect } from '../../fixtures'


/**
 * Navigates to ConnectWallet with chainId=mainnet while the injected wallet
 * is on mainnet. Story's chainId control restricts to Sepolia, so the component
 * shows "Wrong Network" and the button enters data-state="wrong-chain".
 *
 * NOTE: The story's ?chainId URL param drives the ConnectWallet `chainId` prop
 * via useControls(). The injected wallet is on mainnet (chain 0x1), but the
 * component demands Sepolia (11155111) — mismatch triggers wrong-chain state.
 */
test('wrong network - shows wrong-chain state when wallet chain != required chain', async ({ page, wallet }) => {
  // Wallet on Sepolia, story default chainId is "mainnet" -> mismatch.
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/#connectwallet')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const trigger = page.locator('button[class*="tx-cw-button"]').first()
  await expect(trigger).toHaveAttribute('data-state', 'wrong-chain', { timeout: 15_000 })
})
