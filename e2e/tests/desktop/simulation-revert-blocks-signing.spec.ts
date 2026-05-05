import { test, expect } from '../../fixtures'


/**
 * Anti-phishing: when eth_call simulation returns a revert, TransactionButton
 * should go to simulation-failed state and NOT proceed to signing.
 *
 * Strategy: intercept POST requests to the Anvil RPC and return a revert
 * response for eth_call, while letting other methods (eth_chainId, etc) pass through.
 */
test('simulation revert blocks signing - goes to simulation-failed', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })

  // Intercept Anvil RPC calls and return revert for eth_call.
  // Other methods are passed through to allow normal page init.
  await page.route('http://localhost:8545', async (route, request) => {
    const body = request.postDataJSON() as { method?: string; id?: number }

    if (body?.method === 'eth_call') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: body.id ?? 1,
          error: {
            code: 3,
            message: 'execution reverted',
            data: '0x',
          },
        }),
      })
      return
    }

    await route.continue()
  })

  await page.goto('/?chainId=sepolia&simulate=true#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()
  await expect(button).toBeVisible({ timeout: 15_000 })

  await button.click()

  // With simulation enabled and eth_call returning revert, the button should
  // enter simulation-failed state rather than proceeding to signing.
  await expect(button).toHaveAttribute('data-state', 'simulation-failed', { timeout: 15_000 })

  // The button should NOT reach signing state.
  await expect(button).not.toHaveAttribute('data-state', 'signing')
})
