import { describe, expect, it } from 'vitest'
import { mainnet, sepolia } from 'viem/chains'
import { http } from 'viem'

import validateConfig from './validateConfig'


describe('validateConfig', () => {
  it('accepts a single-chain config with matching transport', () => {
    expect(() => validateConfig({
      chains: [ mainnet ],
      transports: { [mainnet.id]: http() },
    })).not.toThrow()
  })

  it('accepts a multi-chain config with transports for every chain', () => {
    expect(() => validateConfig({
      chains: [ mainnet, sepolia ],
      transports: { [mainnet.id]: http(), [sepolia.id]: http() },
    })).not.toThrow()
  })

  it('throws InvalidConfigError when config is null', () => {
    expect(() => validateConfig(null as unknown as TxKit.Config)).toThrow('Config must be an object.')
  })

  it('throws InvalidConfigError when config is a primitive', () => {
    expect(() => validateConfig('not-an-object' as unknown as TxKit.Config)).toThrow('Config must be an object.')
  })

  it('throws when chains is missing', () => {
    expect(() => validateConfig({
      transports: { [mainnet.id]: http() },
    } as unknown as TxKit.Config)).toThrow('At least one chain is required')
  })

  it('throws when chains is an empty array', () => {
    expect(() => validateConfig({
      chains: [],
      transports: {},
    } as unknown as TxKit.Config)).toThrow('At least one chain is required')
  })

  it('throws when transports is missing', () => {
    expect(() => validateConfig({
      chains: [ mainnet ],
    } as unknown as TxKit.Config)).toThrow('Transports must be provided for each chain.')
  })

  it('throws when a chain has no matching transport', () => {
    expect(() => validateConfig({
      chains: [ mainnet, sepolia ],
      transports: { [mainnet.id]: http() },
    } as unknown as TxKit.Config)).toThrow(/Missing transport for chain "Sepolia"/)
  })

  it('skips chain/transport validation when testnet=true and no chains supplied', () => {
    expect(() => validateConfig({ testnet: true } as unknown as TxKit.Config)).not.toThrow()
  })

  it('still validates chain/transport pairing when testnet=true with explicit chains', () => {
    expect(() => validateConfig({
      testnet: true,
      chains: [ mainnet ],
      transports: { [mainnet.id]: http() },
    } as unknown as TxKit.Config)).not.toThrow()
  })

  it('throws when testnet=true with chains but missing transport for them', () => {
    expect(() => validateConfig({
      testnet: true,
      chains: [ mainnet ],
      transports: {},
    } as unknown as TxKit.Config)).toThrow(/Missing transport for chain "Ethereum"/)
  })
})
