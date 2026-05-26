import { decodeCall, BUILTIN_REGISTRY } from '@txkit/tx-decoder'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'

/**
 * Phase 1 Day 5 milestone: wraps @txkit/tx-decoder for the example app.
 *
 * V1 contract:
 *   POST /api/decode { chain: "eip155:421614", call: { to, data, value? } }
 *   -> DecodedCall (per @txkit/tx-decoder shape)
 *
 * Day 5 client renders this through <EnvelopePreview/>.
 *
 * Registry composition:
 *   - BUILTIN_REGISTRY: ERC-20 / Permit2 / Uniswap V3 / Aave V3 / CoW Swap
 *     (5 mainstream protocols, 20 descriptors)
 *   - AgentPolicyGate registry data (Arbitrum Sepolia + Robinhood Chain
 *     testnet) is loaded from examples/arbitrum-london/decoder-data/ until
 *     Mike's deploy populates contracts/deployed.json - see TODO below.
 */
type DecodeRequestBody = {
  chain: `eip155:${number}`,
  call: {
    to: `0x${string}`,
    data: `0x${string}`,
    value?: `0x${string}`,
  },
}

export const POST = async (request: NextRequest) => {
  let body: DecodeRequestBody
  try {
    body = (await request.json()) as DecodeRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.chain !== 'string' || !body.chain.startsWith('eip155:')) {
    return NextResponse.json(
      { error: 'chain must be a CAIP-2 EIP-155 id (e.g. "eip155:421614")' },
      { status: 400 },
    )
  }

  if (typeof body.call?.to !== 'string' || typeof body.call?.data !== 'string') {
    return NextResponse.json({ error: 'call.to and call.data are required' }, { status: 400 })
  }

  // TODO Phase 1 Day 5+: extend registry with examples/arbitrum-london/decoder-data/
  //   const localRegistry = await loadExamplesRegistry()
  //   const registry = mergeRegistries(BUILTIN_REGISTRY, localRegistry)

  try {
    const decoded = await decodeCall(
      { chain: body.chain, call: { to: body.call.to, data: body.call.data } },
      { registry: BUILTIN_REGISTRY },
    )

    // BigInt values (decoded args) do not serialise as JSON by default.
    // Convert through a replacer so the client gets readable strings.
    const safe = JSON.parse(
      JSON.stringify(decoded, (_key, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    )

    return NextResponse.json(safe)
  } catch (decodeError) {
    return NextResponse.json(
      { error: 'Decode failed', detail: String(decodeError) },
      { status: 500 },
    )
  }
}
