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
import { resolvePendleClarify, resolveRwaClarify } from '@/src/agent/grounding'
import { runAgentTurn, type AgentProvider, type AgentTurn } from '@/src/agent/llm'
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
import { getEnv, type Env } from '@/src/config/env'
import { verifyPayment, type SignedPaymentBody } from '@/src/x402/facilitator'


export const runtime = 'nodejs'

/**
 * Agent tool-use loop + EIP-712 envelope signing for both buildathon scenarios.
 *
 *   POST /api/agent { messages, scenario?, receiverAddress?, payment? }
 *   -> { reply, envelope?, scenario, x402Proof? }
 *
 * Pendle (scenario A, Arbitrum Sepolia): the agent reads PENDLE_SYSTEM_PROMPT +
 * PENDLE_TOOL_DEFINITION; on a prepare_pendle_yield_swap call we validate via
 * zod, buildPendleEnvelope, sign EIP-712, and return the signed envelope. A
 * text-only reply is a clarification (no envelope).
 *
 * RWA (scenario C, Robinhood Chain testnet): gated behind the self-hosted x402
 * facilitator - the request must carry a `payment` that re-verifies here (no
 * payment, no model spend). A prepare_rwa_buy call builds + signs an RWA
 * envelope and returns it alongside the canonical X402PaymentProof.
 *
 * The LLM is provider-agnostic (src/agent/llm.ts). LLM_PROVIDER_ORDER sets the
 * preference - free Groq first by default to protect kie.ai credits - and the
 * route falls through to the next configured provider on failure.
 */
const DEFAULT_RECEIVER = '0x000000000000000000000000000000000000dEaD' as const

type AgentRequestBody = {
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  scenario?: 'pendle' | 'rwa',
  receiverAddress?: `0x${string}`,
  payment?: SignedPaymentBody,
}

type LlmCandidate = {
  provider: AgentProvider,
  apiKey: string,
  model: string,
}

const KNOWN_PROVIDERS: AgentProvider[] = [ 'groq', 'kie', 'anthropic' ]

/**
 * Build the ordered list of usable LLM providers from env. LLM_PROVIDER_ORDER
 * sets the preference (free Groq first by default to protect kie.ai credits); a
 * provider with no key is dropped. The route tries them in order, falling
 * through to the next on failure.
 */
const resolveProviderChain = (env: Env): LlmCandidate[] => {
  const registry: Record<AgentProvider, { apiKey: string | undefined, model: string }> = {
    groq: { apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL },
    kie: { apiKey: env.KIE_AI_API_KEY, model: env.KIE_CLAUDE_MODEL },
    anthropic: { apiKey: env.ANTHROPIC_API_KEY, model: 'claude-haiku-4-5' },
  }

  const order = env.LLM_PROVIDER_ORDER
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is AgentProvider => KNOWN_PROVIDERS.includes(entry as AgentProvider))

  return order
    .map((provider) => ({ provider, ...registry[provider] }))
    .filter((candidate): candidate is LlmCandidate => candidate.apiKey !== undefined)
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
  // not live yet. The envelope cannot be built without them, so calling the
  // model here would spend an API request for nothing. The deploy-pending banner
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
  // no model spend.
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

  const { AGENT_SIGNER_PRIVATE_KEY } = env
  const providerChain = resolveProviderChain(env)

  if (providerChain.length === 0) {
    return NextResponse.json(
      {
        error: 'No LLM provider configured',
        hint: 'Set GROQ_API_KEY (free) or KIE_AI_API_KEY in .env.local - see .env.example',
      },
      { status: 503 },
    )
  }

  const systemPrompt = scenario === 'rwa' ? RWA_SYSTEM_PROMPT : PENDLE_SYSTEM_PROMPT
  const toolDefinition = scenario === 'rwa' ? RWA_TOOL_DEFINITION : PENDLE_TOOL_DEFINITION
  const conversation = messages.map((message) => ({ role: message.role, content: message.content }))

  // Try providers in order; on failure fall through to the next configured one.
  let turn: AgentTurn | undefined
  let lastError: unknown
  for (const candidate of providerChain) {
    try {
      turn = await runAgentTurn({
        provider: candidate.provider,
        apiKey: candidate.apiKey,
        model: candidate.model,
        systemPrompt,
        tool: toolDefinition,
        messages: conversation,
      })
      break
    } catch (modelError) {
      lastError = modelError
    }
  }

  if (turn === undefined) {
    return NextResponse.json(
      { error: 'Model call failed', detail: String(lastError) },
      { status: 502 },
    )
  }

  const { textReply, toolName, toolInput } = turn

  // No tool call - the model is asking for clarification or refusing.
  if (toolName === undefined || toolInput === undefined) {
    return NextResponse.json({
      reply: textReply,
      scenario,
    })
  }

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
  // Between parse and build sits the grounding guard (src/agent/grounding.ts):
  // a parameter the user never stated means the model invented it - reject the
  // tool call deterministically and reply with the clarifying question instead.
  const userText = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join('\n')
  const chainId = scenario === 'rwa' ? ROBINHOOD_TESTNET_CHAIN_ID : ARBITRUM_SEPOLIA_CHAIN_ID
  let envelope: DemoEnvelope
  try {
    if (scenario === 'rwa') {
      const rwaArgs = prepareRwaBuyArgs.safeParse(toolInput)
      if (!rwaArgs.success) {
        return NextResponse.json(
          { error: 'Invalid tool args from agent', detail: rwaArgs.error.flatten(), rawInput: toolInput },
          { status: 422 },
        )
      }
      const clarify = resolveRwaClarify(rwaArgs.data, userText)
      if (clarify !== null) {
        return NextResponse.json({ reply: clarify, scenario })
      }
      envelope = buildRwaEnvelope(rwaArgs.data, receiverAddress)
    } else {
      const pendleArgs = preparePendleYieldSwapArgs.safeParse(toolInput)
      if (!pendleArgs.success) {
        return NextResponse.json(
          { error: 'Invalid tool args from agent', detail: pendleArgs.error.flatten(), rawInput: toolInput },
          { status: 422 },
        )
      }
      const clarify = resolvePendleClarify(pendleArgs.data, userText)
      if (clarify !== null) {
        return NextResponse.json({ reply: clarify, scenario })
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
