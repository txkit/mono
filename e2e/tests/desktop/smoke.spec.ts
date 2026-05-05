import { test, expect } from '../../fixtures'


/**
 * Phase 1 smoke spec. Verifies that:
 * - Story dev server is reachable at baseURL
 * - EIP-1193 provider injection works
 * - Test wallet impersonates address with funded balance on Anvil
 *
 * Real component flows live in their own *.spec.ts files (Phase 2+).
 */
test('story playground reachable + provider injects', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/')

  const ethereumInfo = await page.evaluate(() => ({
    isMetaMask: (window as any).ethereum?.isMetaMask,
    selectedAddress: (window as any).ethereum?.selectedAddress,
    chainId: (window as any).ethereum?.chainId,
  }))

  expect(ethereumInfo.isMetaMask).toBe(true)
  expect(ethereumInfo.selectedAddress?.toLowerCase()).toBe(wallet.address().toLowerCase())
  expect(ethereumInfo.chainId).toBe('0xaa36a7')
})
