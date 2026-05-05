import { test, expect } from '../../fixtures'


/**
 * Anti-phishing: when a risk provider returns "malicious" classification,
 * TransactionButton should block submission and NOT show "Send Anyway" option.
 *
 * Uses the blowfish-block-malicious.json fixture via risk.use() fixture.
 *
 * NOTE: This test requires the story to integrate with an actual risk provider
 * URL that the mock intercepts. If the story doesn't call out to Blowfish,
 * this test exercises the UI path via the simulation-failed state instead.
 *
 * TODO(v0.2): TransactionButton currently always shows the "Send Anyway"
 * force-submit option on simulation-failed regardless of classification.
 * BLOCK vs WARN distinction lands with risk-provider integration in v0.2.
 * This spec asserts the desired post-v0.2 behavior; keep skipped until then.
 */
test.skip('blowfish-block-malicious risk fixture - simulation-failed state, no send-anyway', async ({ page, wallet, risk }) => {
  // Register the blowfish malicious mock before navigation.
  await risk.use('blowfish-block-malicious')

  await wallet.init({ chain: 'sepolia' })

  // Use the simulation revert approach to trigger simulation-failed state,
  // which is the current mechanism before native risk provider integration.
  // Once risk provider is integrated in story, remove this route and rely
  // on risk.use('blowfish-block-malicious') interception alone.
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
            message: 'execution reverted: malicious contract',
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

  // Should reach simulation-failed (blocked path).
  await expect(button).toHaveAttribute('data-state', 'simulation-failed', { timeout: 15_000 })

  // "Send Anyway" should NOT be visible for a blocked/malicious classification.
  // It may appear for WARN but not for BLOCK. We assert it's not present.
  const sendAnywayButton = page.locator('button', { hasText: /send anyway/i })
  await expect(sendAnywayButton).not.toBeVisible()
})
