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


const formatTestid = (id: string): string => `[data-testid="${id}"]`


/**
 * Wallet fixture. Call `wallet.init()` BEFORE `page.goto()` so that the
 * EIP-1193 provider is injected on the first frame. After the page loads,
 * call `wallet.connect()` to drive the ConnectWallet UI through the modal.
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

      // Click the ConnectWallet button. Top-level testid is forwarded
      // from the `data-testid` prop in stories; sub-buttons need their
      // own testids (added in the data-testid audit pass).
      await page.locator(formatTestid('connect-wallet-button')).first().click()

      // Pick the first wallet in the modal. Our injected provider
      // announces itself via EIP-6963 so it lands as a top option.
      await page.locator(formatTestid('wallet-modal')).waitFor()
      await page.locator(formatTestid('wallet-modal-item')).first().click()

      // Wait for connected state to render.
      await page.locator(formatTestid('connected-address')).waitFor({ timeout: 10_000 })
    },

    address: () => {
      if (!internal.address) {
        throw new Error('wallet.address(): call wallet.init() first')
      }

      return internal.address
    },
  }
}
