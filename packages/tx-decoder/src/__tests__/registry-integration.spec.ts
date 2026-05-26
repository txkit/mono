import { encodeFunctionData } from 'viem'
import { describe, expect, it } from 'vitest'

import { decodeCall } from '../decode'
import { BUILTIN_REGISTRY } from '../registry/loader'


/**
 * Integration tests that exercise BUILTIN_REGISTRY against real-shape
 * production calldata. Each test pairs a verified mainnet contract
 * address with a canonical calldata sample and asserts the decoded
 * shape matches the JSON registry entry.
 */

describe('BUILTIN_REGISTRY - ERC-20', () => {
  it('decodes USDC transfer on mainnet', async () => {
    // transfer(0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045, 100_000_000) - 100 USDC
    const data = '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000005f5e100'

    const result = await decodeCall(
      {
        call: { to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', data },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('transfer')
    expect(result.args).toHaveLength(2)
    expect(result.args[0]?.name).toBe('to')
    expect(result.args[0]?.value).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
    expect(result.args[1]?.name).toBe('amount')
    expect(result.args[1]?.value).toBe(100_000_000n)
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('USDC')
  })

  it('decodes USDT transfer (ABI quirk: "value" not "amount")', async () => {
    // transfer(0xd8dA..., 1_000_000) - 1 USDT
    const data = '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000f4240'

    const result = await decodeCall(
      {
        call: { to: '0xdAC17F958D2ee523a2206206994597C13D831ec7', data },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('transfer')
    // USDT uses "value" not "amount" - real ABI quirk verified on Etherscan.
    expect(result.args[1]?.name).toBe('value')
  })

  it('decodes WETH deposit (payable, no args)', async () => {
    // deposit() - selector only, with 1 ETH attached (HexQuantity per EvmCall.value)
    const data = '0xd0e30db0'

    const result = await decodeCall(
      {
        call: { to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', data, value: '0xde0b6b3a7640000' },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('deposit')
    expect(result.args).toHaveLength(0)
    expect((result.clearSigning as { title?: string } | undefined)?.title).toBe('Wrap ETH to WETH')
  })

  it('decodes WETH approve to a spender with max allowance', async () => {
    // approve(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45, MaxUint256)
    const data = '0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

    const result = await decodeCall(
      {
        call: { to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', data },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('approve')
    expect(result.args[0]?.name).toBe('spender')
    expect(result.args[1]?.value).toBe(115792089237316195423570985008687907853269984665640564039457584007913129639935n)
  })
})


describe('BUILTIN_REGISTRY - Permit2', () => {
  // Round-trip encode via viem ensures the JSON ABI tuple shape is correct.
  const permitAbi = [
    {
      type: 'function',
      name: 'permit',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'owner', type: 'address' },
        {
          name: 'permitSingle',
          type: 'tuple',
          components: [
            {
              name: 'details',
              type: 'tuple',
              components: [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint160' },
                { name: 'expiration', type: 'uint48' },
                { name: 'nonce', type: 'uint48' },
              ],
            },
            { name: 'spender', type: 'address' },
            { name: 'sigDeadline', type: 'uint256' },
          ],
        },
        { name: 'signature', type: 'bytes' },
      ],
      outputs: [],
    },
  ] as const

  const samplePermitCalldata = encodeFunctionData({
    abi: permitAbi,
    functionName: 'permit',
    args: [
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      {
        details: {
          token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          amount: 1000000000n,
          expiration: 1735689600,
          nonce: 0,
        },
        spender: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        sigDeadline: 1735689600n,
      },
      '0x',
    ],
  })

  it('decodes Permit2 permit on mainnet', async () => {
    const result = await decodeCall(
      {
        call: { to: '0x000000000022D473030F116dDEE9F6B43aC78BA3', data: samplePermitCalldata },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('permit')
    expect(result.args[0]?.name).toBe('owner')
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('Permit2')
  })

  it('resolves the same Permit2 deployment on Arbitrum', async () => {
    const result = await decodeCall(
      {
        call: { to: '0x000000000022D473030F116dDEE9F6B43aC78BA3', data: samplePermitCalldata },
        chain: 'eip155:42161',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('permit')
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('Arbitrum')
  })
})


describe('BUILTIN_REGISTRY - Uniswap V3 SwapRouter02', () => {
  const exactInputSingleAbi = [
    {
      type: 'function',
      name: 'exactInputSingle',
      stateMutability: 'payable',
      inputs: [
        {
          name: 'params',
          type: 'tuple',
          components: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'recipient', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMinimum', type: 'uint256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' },
          ],
        },
      ],
      outputs: [{ name: 'amountOut', type: 'uint256' }],
    },
  ] as const

  const sampleSwapCalldata = encodeFunctionData({
    abi: exactInputSingleAbi,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        fee: 3000,
        recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        amountIn: 1000000000000000000n,
        amountOutMinimum: 1800000000n,
        sqrtPriceLimitX96: 0n,
      },
    ],
  })

  it('decodes exactInputSingle on mainnet SwapRouter02', async () => {
    const result = await decodeCall(
      {
        call: { to: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', data: sampleSwapCalldata },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('exactInputSingle')
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('Uniswap V3')
  })

  it('decodes the same call on Base (different address per chain)', async () => {
    const result = await decodeCall(
      {
        call: { to: '0x2626664c2603336E57B271c5C0b26F421741e481', data: sampleSwapCalldata },
        chain: 'eip155:8453',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('exactInputSingle')
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('Base')
  })

  it('decodes multicall (deadline variant) on mainnet', async () => {
    // multicall(uint256 deadline, bytes[] data) with empty data array
    const multicallAbi = [
      {
        type: 'function',
        name: 'multicall',
        stateMutability: 'payable',
        inputs: [
          { name: 'deadline', type: 'uint256' },
          { name: 'data', type: 'bytes[]' },
        ],
        outputs: [{ name: 'results', type: 'bytes[]' }],
      },
    ] as const

    const multicallCalldata = encodeFunctionData({
      abi: multicallAbi,
      functionName: 'multicall',
      args: [ 9999999999n, [] ],
    })

    const result = await decodeCall(
      {
        call: { to: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', data: multicallCalldata },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('multicall')
    expect(result.args[0]?.name).toBe('deadline')
    expect(result.args[0]?.value).toBe(9999999999n)
  })
})


describe('BUILTIN_REGISTRY - Aave V3 Pool', () => {
  const supplyAbi = [
    {
      type: 'function',
      name: 'supply',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'asset', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'onBehalfOf', type: 'address' },
        { name: 'referralCode', type: 'uint16' },
      ],
      outputs: [],
    },
  ] as const

  const withdrawAbi = [
    {
      type: 'function',
      name: 'withdraw',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'asset', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'to', type: 'address' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const

  it('decodes supply on mainnet Aave V3 Pool', async () => {
    const data = encodeFunctionData({
      abi: supplyAbi,
      functionName: 'supply',
      args: [
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        1000_000000n,
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        0,
      ],
    })

    const result = await decodeCall(
      {
        call: { to: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', data },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('supply')
    expect(result.args[0]?.name).toBe('asset')
    expect(result.args[1]?.value).toBe(1000_000000n)
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('supply')
  })

  it('decodes withdraw on Arbitrum Aave V3 Pool (shared address with Optimism/Polygon)', async () => {
    const data = encodeFunctionData({
      abi: withdrawAbi,
      functionName: 'withdraw',
      args: [
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        500_000000n,
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      ],
    })

    const result = await decodeCall(
      {
        call: { to: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', data },
        chain: 'eip155:42161',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('withdraw')
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('Arbitrum')
  })
})


describe('BUILTIN_REGISTRY - CoW Swap ETH Flow', () => {
  // ABI sourced from StakeWise frontwise production
  // (apps/web/src/contracts/abis/SwapEthFlow.json) - this is the contract
  // shipped behind the production swap UI at app.stakewise.io.
  const createOrderAbi = [
    {
      type: 'function',
      name: 'createOrder',
      stateMutability: 'payable',
      inputs: [
        {
          name: 'order',
          type: 'tuple',
          components: [
            { name: 'buyToken', type: 'address' },
            { name: 'receiver', type: 'address' },
            { name: 'sellAmount', type: 'uint256' },
            { name: 'buyAmount', type: 'uint256' },
            { name: 'appData', type: 'bytes32' },
            { name: 'feeAmount', type: 'uint256' },
            { name: 'validTo', type: 'uint32' },
            { name: 'partiallyFillable', type: 'bool' },
            { name: 'quoteId', type: 'int64' },
          ],
        },
      ],
      outputs: [{ name: 'orderHash', type: 'bytes32' }],
    },
  ] as const

  const sampleOrderCalldata = encodeFunctionData({
    abi: createOrderAbi,
    functionName: 'createOrder',
    args: [
      {
        buyToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        receiver: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        sellAmount: 1000000000000000000n,
        buyAmount: 1800000000n,
        appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
        feeAmount: 0n,
        validTo: 1735689600,
        partiallyFillable: false,
        quoteId: 0n,
      },
    ],
  })

  it('decodes createOrder on mainnet CoW SwapEthFlow', async () => {
    const result = await decodeCall(
      {
        call: { to: '0xbA3cB449bD2B4ADddBc894D8697F5170800EAdeC', data: sampleOrderCalldata },
        chain: 'eip155:1',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('createOrder')
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('CoW Swap')
  })

  it('decodes the same createOrder on Gnosis chain', async () => {
    const result = await decodeCall(
      {
        call: { to: '0xbA3cB449bD2B4ADddBc894D8697F5170800EAdeC', data: sampleOrderCalldata },
        chain: 'eip155:100',
      },
      { registry: BUILTIN_REGISTRY },
    )

    expect(result.source).toBe('registry')
    expect(result.functionName).toBe('createOrder')
    expect((result.clearSigning as { title?: string } | undefined)?.title).toContain('Gnosis')
  })
})
