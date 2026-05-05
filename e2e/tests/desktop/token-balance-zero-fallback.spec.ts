import { test, expect } from '../../fixtures'


/**
 * A fresh random wallet on Anvil-backed Sepolia has no ERC-20 balance.
 * TokenBalance should show "0" or a dash/em-dash fallback rather than
 * crashing or hanging indefinitely.
 *
 * NOTE: wagmi reads from publicnode.com (not Anvil), so balance reflects
 * the real Sepolia chain for this address. A fresh random address has 0
 * tokens on both Anvil and public Sepolia.
 */
test('TokenBalance renders text content for connected wallet', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#tokenbalance')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // TokenBalance renders any of: tx-tb-line, tx-tb-text, tx-tb-row.
  // For a fresh address on real Sepolia: "0 ETH", "—", or similar.
  const balance = page.locator('[class*="tx-tb"]').first()
  await expect(balance).toBeVisible({ timeout: 20_000 })

  const text = (await balance.textContent({ timeout: 15_000 }) || '').trim()
  expect(text.length).toBeGreaterThan(0)
})
