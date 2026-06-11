import { describe, expect, it } from 'vitest'

import { resolvePendleClarify, resolveRwaClarify } from './grounding'


const USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
const WETH = '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73'
const PT_STETH = '0x000000000000000000000000000000000000dE01'

const pendleArgs = (amountIn: string, tokenIn: string = USDC) => ({
  tokenIn,
  tokenOut: PT_STETH,
  amountIn,
  slippageBps: 50,
})

describe('resolvePendleClarify', () => {
  it('passes when the user stated the amount', () => {
    expect(resolvePendleClarify(pendleArgs('100000000'), 'Swap 100 USDC for PT-stETH')).toBeNull()
  })

  it('asks for the amount when the model invented it', () => {
    expect(resolvePendleClarify(pendleArgs('100000000'), 'Swap usdc fot pt-steth'))
      .toBe('How much USDC would you like to swap?')
  })

  it('grounds the amount stated in a later turn', () => {
    expect(resolvePendleClarify(pendleArgs('25000000'), 'Swap USDC for PT-stETH\n25')).toBeNull()
  })

  it('handles decimal WETH amounts', () => {
    expect(resolvePendleClarify(pendleArgs('500000000000000000', WETH), 'swap 0.5 WETH for PT-stETH')).toBeNull()
  })

  it('grounds amounts written with a thousands separator', () => {
    expect(resolvePendleClarify(pendleArgs('1000000000'), 'Swap 1,000 USDC for PT-stETH')).toBeNull()
  })
})

describe('resolveRwaClarify', () => {
  it('passes when the user stated asset and amount', () => {
    expect(resolveRwaClarify({ asset: 'TSLA', amount: 5 }, 'Buy 5 TSLA')).toBeNull()
  })

  it('asks for the asset when it was never mentioned', () => {
    expect(resolveRwaClarify({ asset: 'PLTR', amount: 10 }, 'How are you?'))
      .toBe('Which asset would you like to buy - TSLA, AMZN, or PLTR?')
  })

  it('accepts the company name as grounding for the ticker', () => {
    expect(resolveRwaClarify({ asset: 'TSLA', amount: 5 }, 'buy 5 tesla')).toBeNull()
  })

  it('asks for the amount when only the asset was stated', () => {
    expect(resolveRwaClarify({ asset: 'PLTR', amount: 10 }, 'Buy PLTR'))
      .toBe('How many PLTR units would you like to buy?')
  })

  it('grounds unit counts written with a thousands separator', () => {
    expect(resolveRwaClarify({ asset: 'AMZN', amount: 1000 }, 'Buy 1,000 AMZN')).toBeNull()
  })
})
