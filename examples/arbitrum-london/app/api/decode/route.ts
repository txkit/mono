import {
  decodeCall,
  BUILTIN_REGISTRY,
  buildRegistry,
  type RegistryDescriptor,
} from '@txkit/tx-decoder'
import { NextResponse, type NextRequest } from 'next/server'

import deployedJson from '@/contracts/deployed.json'
import agentPolicyGateData from '@/decoder-data/agent-policy-gate.json'
import mockPendleRouterData from '@/decoder-data/mock-pendle-router.json'
import mockRwaRouterData from '@/decoder-data/mock-rwa-router.json'


export const runtime = 'nodejs'

/**
 * Phase 1 Day 5 milestone: wraps @txkit/tx-decoder for the example app.
 *
 * V1 contract:
 *   POST /api/decode { chain: "eip155:421614", call: { to, data, value? } }
 *   -> DecodedCall (per @txkit/tx-decoder shape)
 *
 * Registry composition:
 *   - BUILTIN_REGISTRY: ERC-20 / Permit2 / Uniswap V3 / Aave V3 / CoW Swap
 *     (5 mainstream protocols, 20 descriptors)
 *   - examples/arbitrum-london/decoder-data: AgentPolicyGate + MockPendleRouter
 *     (Arbitrum Sepolia, Robinhood Chain testnet). Addresses are placeholder
 *     0x0000...0000 in JSON; the merge step below patches them with real
 *     addresses from contracts/deployed.json once Mike deploys.
 *
 * Day 5 client renders this through <EnvelopePreview/>.
 */
type DecodeRequestBody = {
  chain: `eip155:${number}`,
  call: {
    to: `0x${string}`,
    data: `0x${string}`,
    value?: `0x${string}`,
  },
}

type DeployedEntry = { address: string }
type DeployedMap = Record<string, Record<string, DeployedEntry>>

const deployedMap = deployedJson as DeployedMap

/**
 * Patch placeholder addresses (0x0000...0000) in the example decoder data
 * with real addresses from contracts/deployed.json once a forge deploy
 * script lands. Entries still in PENDING state stay as-is - the decoder
 * misses them until the real contract is live, which surfaces the deploy
 * gap rather than silently mis-decoding.
 */
const resolveDescriptors = (
  data: ReadonlyArray<RegistryDescriptor>,
  contractName: string,
): ReadonlyArray<RegistryDescriptor> => {
  const section = deployedMap[contractName]
  if (section === undefined) {
    return data
  }
  return data.map((descriptor) => {
    const chainId = String(Number(descriptor.chain.split(':')[1]))
    const entry = section[chainId]
    if (entry === undefined) {
      return descriptor
    }
    const isReal =
      /^0x[a-fA-F0-9]{40}$/.test(entry.address) && !entry.address.includes('PENDING')
    if (!isReal) {
      return descriptor
    }
    return { ...descriptor, address: entry.address as `0x${string}` }
  })
}

const exampleDescriptors: ReadonlyArray<RegistryDescriptor> = [
  ...resolveDescriptors(
    agentPolicyGateData as unknown as ReadonlyArray<RegistryDescriptor>,
    'AgentPolicyGate',
  ),
  ...resolveDescriptors(
    mockPendleRouterData as unknown as ReadonlyArray<RegistryDescriptor>,
    'MockPendleRouter',
  ),
  ...resolveDescriptors(
    mockRwaRouterData as unknown as ReadonlyArray<RegistryDescriptor>,
    'MockRwaRouter',
  ),
]

const exampleRegistry = buildRegistry(exampleDescriptors)

// The Registry type is not exported from the @txkit/tx-decoder barrel yet, so
// we merge by spread - the inferred shape is structurally compatible.
const mergedRegistry = {
  ...BUILTIN_REGISTRY,
  ...exampleRegistry,
}

export const POST = async (request: NextRequest) => {
  let body: DecodeRequestBody
  try {
    body = (await request.json()) as DecodeRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { chain, call } = body

  if (typeof chain !== 'string' || !chain.startsWith('eip155:')) {
    return NextResponse.json(
      { error: 'chain must be a CAIP-2 EIP-155 id (e.g. "eip155:421614")' },
      { status: 400 },
    )
  }

  if (typeof call?.to !== 'string' || typeof call?.data !== 'string') {
    return NextResponse.json({ error: 'call.to and call.data are required' }, { status: 400 })
  }

  try {
    const decoded = await decodeCall(
      { chain, call: { to: call.to, data: call.data, operation: 'call' } },
      { registry: mergedRegistry },
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
