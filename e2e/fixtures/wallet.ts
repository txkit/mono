import { Wallet } from 'ethers'
import type { Page } from '@playwright/test'

import { initProvider } from '../helpers/initProvider'
import type { SupportedChain } from '../helpers/chains'


type InitInput = {
  chain?: SupportedChain
  privateKey?: string
  address?: string
}

export type WalletFixture = {
  init: (input?: InitInput) => Promise<void>
  connect: () => Promise<void>
  address: () => string
}


type Internal = {
  address: string | null
}


/**
 * Wallet fixture. Call `wallet.init()` BEFORE `page.goto()` so the
 * EIP-1193 provider is injected on the first frame. After the page
 * loads, call `wallet.connect()` to drive the ConnectWallet UI.
 *
 * Selectors prefer roles over testids — txKit library code has no
 * internal data-testid attributes; story playground may add wrappers
 * with `data-testid` if a role-based selector is ambiguous.
 */
export const setupWallet = async ({ page }: { page: Page }): Promise<WalletFixture> => {
  const internal: Internal = { address: null }

  return {
    init: async (input = {}) => {
      const privateKey = input.privateKey || Wallet.createRandom().privateKey
      const { address } = await initProvider({
        page,
        chain: input.chain || 'sepolia',
        address: input.address,
        privateKey,
      })

      internal.address = address
    },

    connect: async () => {
      if (!internal.address) {
        throw new Error('wallet.connect(): call wallet.init() first')
      }

      // ConnectWallet renders a button labeled "Connect Wallet" by default.
      // Story may override the label via the `label` prop — specs that
      // change the label should pass it explicitly via wallet.connect().
      await page.getByRole('button', { name: /connect wallet/i }).first().click()

      // Wait for the modal dialog to appear, then click the EIP-6963
      // provider entry. Our injected provider announces itself as
      // "txKit E2E Wallet" so it shows up in the wallet list.
      const modal = page.getByRole('dialog', { name: /connect wallet/i })
      await modal.waitFor({ state: 'visible' })

      await modal.getByRole('button', { name: /txkit e2e wallet/i }).click()

      // Connected state renders address + balance in the trigger button.
      // We wait for the connect-wallet button label to change away from
      // the "Connect Wallet" CTA — most reliable indicator across themes.
      await page.waitForFunction(() => {
        const btn = document.querySelector('button[class*="tx-cw-button"]')
        return btn && !/connect wallet/i.test(btn.textContent || '')
      }, { timeout: 10_000 })
    },

    address: () => {
      if (!internal.address) {
        throw new Error('wallet.address(): call wallet.init() first')
      }

      return internal.address
    },
  }
}
