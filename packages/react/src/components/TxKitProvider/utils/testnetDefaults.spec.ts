import { describe, it, expect } from 'vitest'
import { mainnet, sepolia } from 'viem/chains'

import {
  TESTNET_CHAINS,
  TESTNET_DISPLAY_CHAINS,
  TESTNET_TRANSPORTS,
} from './testnetDefaults'


describe('testnetDefaults', () => {

  describe('TESTNET_CHAINS', () => {
    it('contains sepolia as first chain (the target testnet)', () => {
      expect(TESTNET_CHAINS[0].id).toBe(sepolia.id)
    })

    it('includes mainnet for ENS resolver hooks', () => {
      const chainIds = TESTNET_CHAINS.map((chain) => chain.id)
      expect(chainIds).toContain(mainnet.id)
    })

    it('has sepolia marked as testnet', () => {
      const sepoliaChain = TESTNET_CHAINS.find((chain) => chain.id === sepolia.id)
      expect(sepoliaChain?.testnet).toBe(true)
    })
  })

  describe('TESTNET_DISPLAY_CHAINS', () => {
    it('contains only sepolia (mainnet filtered out of UI)', () => {
      expect(TESTNET_DISPLAY_CHAINS).toHaveLength(1)
      expect(TESTNET_DISPLAY_CHAINS[0].id).toBe(sepolia.id)
    })
  })

  describe('TESTNET_TRANSPORTS', () => {
    it('has a transport entry for every chain in TESTNET_CHAINS', () => {
      for (const chain of TESTNET_CHAINS) {
        expect(TESTNET_TRANSPORTS[chain.id]).toBeDefined()
      }
    })

    it('transport entries are viem Transport functions', () => {
      expect(typeof TESTNET_TRANSPORTS[sepolia.id]).toBe('function')
      expect(typeof TESTNET_TRANSPORTS[mainnet.id]).toBe('function')
    })
  })

})
