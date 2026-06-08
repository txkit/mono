import { NextResponse, type NextRequest } from 'next/server'
import type { Hex } from 'viem'

import type { X402PaymentProof } from '@txkit/x402-adapter'

import { ARBITRUM_SEPOLIA_CHAIN_ID, ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import {
  attachAgentSignature,
  buildPendleEnvelope,
  buildRwaEnvelope,
  type DemoEnvelope,
} from '@/src/agent/envelope-builder'
import { signEnvelope } from '@/src/agent/signing'
import {
  PENDLE_SYSTEM_PROMPT,
  RWA_SYSTEM_PROMPT,
} from '@/src/agent/system-prompt'
import {
  PENDLE_TOOL_DEFINITION,
  RWA_TOOL_DEFINITION,
  preparePendleYieldSwapArgs,
  prepareRwaBuyArgs,
} from '@/src/agent/tools'
import {
  checkIsAgentPolicyGateDeployed,
  checkIsMockPendleRouterDeployed,
  checkIsMockRwaRouterDeployed,
  getAgentPolicyGateAddress,
} from '@/src/config/deployed'
import { getEnv } from '@/src/config/env'
import { verifyPayment, type SignedPaymentBody } from '@/src/x402/facilitator'


export const runtime = 'nodejs'

/**
 * Agent tool-use loop + EIP-712 envelope signing for both buildathon scenarios.
 *
 *   POST /api/agent { messages, scenario?, receiverAddress?, payment? }
 *   -> { reply, envelope?, scenario, x402Proof? }
 *
 * Pendle (scenario A, Arbitrum Sepolia): Claude reads PENDLE_SYSTEM_PROMPT +
 * PENDLE_TOOL_DEFINITION; on a prepare_pendle_yield_swap call we validate via
 * zod, buildPendleEnvelope, sign EIP-712, and return the signed envelope. A
 * text-only reply is a clarification (no envelope).
 *
 * RWA (scenario C, Robinhood Chain testnet): gated behind the self-hosted x402
 * facilitator - the request must carry a `payment` that re-verifies here (no
 * payment, no model spend). A prepare_rwa_buy call builds + signs an RWA
 * envelope and returns it alongside the canonical X402PaymentProof.
 *
 * The SDK is dynamically imported inside the handler so the route module stays
 * loadable even when ANTHROPIC_API_KEY is unset (better DX for the first clone).
 */
const DEFAULT_RECEIVER = '0x000000000000000000000000000000000000dEaD' as const

type AgentRequestBody = {
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  scenario?: 'pendle' | 'rwa',
  receiverAddress?: `0x${string}`,
  payment?: SignedPaymentBody,
}

type ToolUseBlock = {
  type: 'tool_use',
  id: string,
  name: string,
  input: Record<string, unknown>,
}

type TextBlock = {
  type: 'text',
  text: string,
}

type ResponseContentBlock = ToolUseBlock | TextBlock | { type: string }

const checkIsToolUseBlock = (block: ResponseContentBlock): block is ToolUseBlock => {
  return block.type === 'tool_use'
}

const checkIsTextBlock = (block: ResponseContentBlock): block is TextBlock => {
  return block.type === 'text'
}

export const POST = async (request: NextRequest) => {
  let body: AgentRequestBody
  try {
    body = (await request.json()) as AgentRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages, scenario = 'pendle', receiverAddress = DEFAULT_RECEIVER, payment } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 })
  }

  // Cost guard: skip the model call entirely when the scenario A contracts are
  // not live yet. The envelope cannot be built without them, so calling Claude
  // here would spend an API request for nothing. The deploy-pending banner
  // already tells the user they are in preview mode.
  if (scenario === 'pendle') {
    const isGateDeployed = checkIsAgentPolicyGateDeployed(ARBITRUM_SEPOLIA_CHAIN_ID)
    const isRouterDeployed = checkIsMockPendleRouterDeployed(ARBITRUM_SEPOLIA_CHAIN_ID)
    const isScenarioReady = isGateDeployed && isRouterDeployed
    if (!isScenarioReady) {
      return NextResponse.json(
        {
          error: 'Contracts not deployed yet',
          hint:
            'AgentPolicyGate / MockPendleRouter are still placeholder addresses on ' +
            'Arbitrum Sepolia. Deploy them (see DEPLOY.md) and update contracts/deployed.json.',
        },
        { status: 503 },
      )
    }
  }

  // Scenario C is gated behind the self-hosted x402 facilitator. Re-verify the
  // signed payment here (the /api/x402 verify is stateless, so a client could hit
  // this route directly) and skip the model entirely on any failure - no payment,
  // no Claude spend.
  let x402Proof: X402PaymentProof | undefined
  if (scenario === 'rwa') {
    const isGateDeployed = checkIsAgentPolicyGateDeployed(ROBINHOOD_TESTNET_CHAIN_ID)
    const isRouterDeployed = checkIsMockRwaRouterDeployed(ROBINHOOD_TESTNET_CHAIN_ID)
    const isScenarioReady = isGateDeployed && isRouterDeployed
    if (!isScenarioReady) {
      return NextResponse.json(
        {
          error: 'Contracts not deployed yet',
          hint:
            'AgentPolicyGate / MockRwaRouter are still placeholder addresses on ' +
            'Robinhood Chain testnet. Deploy them (see DEPLOY.md) and update contracts/deployed.json.',
        },
        { status: 503 },
      )
    }
    if (payment === undefined) {
      return NextResponse.json(
        {
          error: 'Payment required',
          hint: 'Pay the x402 challenge (POST /api/x402) before invoking the RWA agent.',
        },
        { status: 402 },
      )
    }
    let verifyResult
    try {
      verifyResult = await verifyPayment({ ...payment, amount: BigInt(payment.amount) })
    } catch (paymentError) {
      return NextResponse.json(
        { error: 'Invalid payment payload', detail: String(paymentError) },
        { status: 400 },
      )
    }
    if (!verifyResult.ok) {
      return NextResponse.json(
        { error: 'Payment verification failed', detail: verifyResult.reason },
        { status: 402 },
      )
    }
    x402Proof = verifyResult.proof
  }

  let env
  try {
    env = getEnv()
  } catch (parseError) {
    return NextResponse.json(
      { error: 'Server env invalid', detail: String(parseError) },
      { status: 500 },
    )
  }

  const { ANTHROPIC_API_KEY, AGENT_SIGNER_PRIVATE_KEY } = env

  if (ANTHROPIC_API_KEY === undefined) {
    return NextResponse.json(
      {
        error: 'ANTHROPIC_API_KEY not set',
        hint: 'Add ANTHROPIC_API_KEY to .env.local - see .env.example',
      },
      { status: 503 },
    )
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk').catch(() => ({ default: null }))
  if (Anthropic === null) {
    return NextResponse.json(
      {
        error: '@anthropic-ai/sdk not installed',
        hint: 'Run `pnpm install` in the workspace root to pull workspace deps',
      },
      { status: 503 },
    )
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  const systemPrompt = scenario === 'rwa' ? RWA_SYSTEM_PROMPT : PENDLE_SYSTEM_PROMPT
  const toolDefinition = scenario === 'rwa' ? RWA_TOOL_DEFINITION : PENDLE_TOOL_DEFINITION

  let completion
  try {
    completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      tools: [ toolDefinition ],
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    })
  } catch (modelError) {
    return NextResponse.json(
      { error: 'Model call failed', detail: String(modelError) },
      { status: 502 },
    )
  }

  const contentBlocks = completion.content as ResponseContentBlock[]
  const textReply = contentBlocks
    .filter(checkIsTextBlock)
    .map((block) => block.text)
    .join('\n')
  const toolUseBlock = contentBlocks.find(checkIsToolUseBlock)

  // No tool call - Claude is asking for clarification or refusing.
  if (toolUseBlock === undefined) {
    return NextResponse.json({
      reply: textReply,
      scenario,
    })
  }

  const { name: toolName, input: toolInput } = toolUseBlock

  const expectedTool = scenario === 'rwa' ? 'prepare_rwa_buy' : 'prepare_pendle_yield_swap'
  if (toolName !== expectedTool) {
    return NextResponse.json(
      {
        error: `Unexpected tool call: ${toolName}`,
        detail: `Only ${expectedTool} is wired in the ${scenario} scenario.`,
      },
      { status: 502 },
    )
  }

  // Build the envelope with the scenario's zod schema + builder. The builders
  // throw a clear error before deploy (getMock*RouterAddress), surfaced as 503.
  const chainId = scenario === 'rwa' ? ROBINHOOD_TESTNET_CHAIN_ID : ARBITRUM_SEPOLIA_CHAIN_ID
  let envelope: DemoEnvelope
  try {
    if (scenario === 'rwa') {
      const rwaArgs = prepareRwaBuyArgs.safeParse(toolInput)
      if (!rwaArgs.success) {
        return NextResponse.json(
          { error: 'Invalid tool args from Claude', detail: rwaArgs.error.flatten(), rawInput: toolInput },
          { status: 422 },
        )
      }
      envelope = buildRwaEnvelope(rwaArgs.data, receiverAddress)
    } else {
      const pendleArgs = preparePendleYieldSwapArgs.safeParse(toolInput)
      if (!pendleArgs.success) {
        return NextResponse.json(
          { error: 'Invalid tool args from Claude', detail: pendleArgs.error.flatten(), rawInput: toolInput },
          { status: 422 },
        )
      }
      envelope = buildPendleEnvelope(pendleArgs.data, receiverAddress)
    }
  } catch (buildError) {
    return NextResponse.json(
      {
        error: 'Envelope build failed',
        detail: String(buildError),
        hint:
          'Most often this means the scenario contracts are not deployed yet. ' +
          'Run the forge scripts and update contracts/deployed.json.',
      },
      { status: 503 },
    )
  }

  if (AGENT_SIGNER_PRIVATE_KEY === undefined) {
    return NextResponse.json(
      {
        error: 'AGENT_SIGNER_PRIVATE_KEY not set',
        hint:
          'Required for EIP-712 envelope binding. Add a testnet key to .env.local ' +
          'matching AGENT_SIGNER_ADDRESS.',
      },
      { status: 503 },
    )
  }

  const { meta, inner } = envelope

  let signedEnvelope: DemoEnvelope
  try {
    const gateAddress = getAgentPolicyGateAddress(chainId)
    const signature = await signEnvelope({
      envelopeHash: meta.envelopeHash,
      to: inner.to,
      data: inner.data,
      value: BigInt(inner.value),
      chainId,
      gateAddress,
      signerPrivateKey: AGENT_SIGNER_PRIVATE_KEY as Hex,
    })
    signedEnvelope = attachAgentSignature(envelope, signature)
  } catch (signError) {
    return NextResponse.json(
      { error: 'Signing failed', detail: String(signError) },
      { status: 500 },
    )
  }

  return NextResponse.json({
    reply: textReply,
    envelope: signedEnvelope,
    scenario,
    x402Proof,
  })
}
