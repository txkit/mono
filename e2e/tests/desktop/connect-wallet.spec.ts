import { test, expect } from '../../fixtures'


test('auto-connects via EIP-6963 and shows address + balance', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })

  // ?chainId=sepolia matches our injected wallet's chain so ConnectWallet
  // shows connected (not wrong-chain). Wagmi auto-reconnects to our
  // EIP-6963 announce on mount, no UI clicks required.
  await page.goto('/?chainId=sepolia#connectwallet')

  // Click Live tab to render real <ConnectWallet> via wagmi.
  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // The trigger button shows "0xabcd...wxyz <balance> ETH" once connected.
  // Balance comes from wagmi's publicClient (Sepolia public RPC), not from
  // Anvil — anvil_setBalance only affects Anvil state, not public chain
  // reads. Asserting address presence is enough for connect verification.
  const trigger = page.locator('button[class*="tx-cw-button"]').first()
  await expect(trigger).toContainText(/0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}/, { timeout: 15_000 })
  await expect(trigger).toHaveAttribute('data-state', 'connected', { timeout: 15_000 })
  await expect(trigger).toContainText(/ETH/, { timeout: 15_000 })

  // Lower-cased shortened address should match the injected wallet address.
  const addr = wallet.address().toLowerCase()
  const expectedShort = `${addr.slice(0, 6)}...${addr.slice(-4)}`
  await expect(trigger).toContainText(expectedShort, { ignoreCase: true })
})
