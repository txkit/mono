import { test, expect } from '../../fixtures'


/**
 * Anti-phishing: address-poisoning envelope should surface a warning about
 * visually similar addresses.
 *
 * TODO: This spec requires story playground support for adversarial fixtures.
 * The ?adversarial=address-poisoning URL param is not yet implemented.
 *
 * The address-poisoning.json fixture has a counterparty with `similarToRecent`
 * populated, which should trigger txKit's address-poisoning warning UI showing
 * the full address (not truncated) and a "Similar to recent recipient" banner.
 *
 * STORY CHANGE NEEDED: Add ?adversarial URL param support to load the
 * address-poisoning.json PreparedEnvelope. The rendered preview should show
 * the full recipient address and a poisoning warning.
 *
 * For now: verify the story page loads and has no JS errors on address-poisoning path.
 */
test('address-poisoning adversarial fixture placeholder - story loads cleanly', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })

  // TODO: Replace with ?adversarial=address-poisoning once story support is added.
  await page.goto('/?chainId=sepolia#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // No JS errors should occur on load.
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.locator('button[class*="tx-txb-button"]').first().waitFor({ state: 'visible', timeout: 15_000 })

  expect(errors.filter((message) => !message.includes('ResizeObserver'))).toEqual([])
})
