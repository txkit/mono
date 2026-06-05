import { NextResponse, type NextRequest } from 'next/server'
import type { Hex } from 'viem'

import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import {
  attachAgentSignature,
  buildPendleEnvelope,
  type DemoEnvelope,
} from '@/src/agent/envelope-builder'
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
} from '@/src/agent/tools'
import {
  checkIsAgentPolicyGateDeployed,
  checkIsMockPendleRouterDeployed,
  getAgentPolicyGateAddress,
} from '@/src/config/deployed'
import { getEnv } from '@/src/config/env'


export const runtime = 'nodejs'

/**
 * Phase 1 Day 5 milestone: tool-use loop + EIP-712 envelope signing.
 *
 * V1 contract:
 *   POST /api/agent { messages, scenario?, receiverAddress? }
 *   -> { reply, envelope?, scenario, milestone }
 *
 * Pendle flow:
 *   1. The model reads PENDLE_SYSTEM_PROMPT + receives PENDLE_TOOL_DEFINITION.
 *   2. If args are clear: it calls prepare_pendle_yield_swap.
 *   3. We validate via zod, buildPendleEnvelope, sign EIP-712 via signEnvelope,
 *      attach signature, return both the assistant's text reply (if any) and
 *      the signed envelope.
 *   4. If the model asks for clarification (text only): return reply, no envelope.
 *
 * RWA flow lands Phase 2 Day 10.
 *
 * The model call is delegated to runAgentTurn (src/agent/llm.ts), which picks
 * Anthropic Claude when ANTHROPIC_API_KEY is set and otherwise the free,
 * OpenAI-compatible Groq endpoint when GROQ_API_KEY is set. Everything below the
 * call is provider-agnostic.
 */
const DEFAULT_RECEIVER = '0x000000000000000000000000000000000000dEaD' as const

type AgentRequestBody = {
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  scenario?: 'pendle' | 'rwa',
  receiverAddress?: `0x${string}`,
}

export const POST = async (request: NextRequest) => {
  let body: AgentRequestBody
  try {
    body = (await request.json()) as AgentRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages, scenario = 'pendle', receiverAddress = DEFAULT_RECEIVER } = body

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

  let env
  try {
    env = getEnv()
  } catch (parseError) {
    return NextResponse.json(
      { error: 'Server env invalid', detail: String(parseError) },
      { status: 500 },
    )
  }

  const { ANTHROPIC_API_KEY, GROQ_API_KEY, GROQ_MODEL, AGENT_SIGNER_PRIVATE_KEY } = env

  let provider: AgentProvider | null = null
  let apiKey: string | undefined
  let model = ''
  if (ANTHROPIC_API_KEY !== undefined) {
    provider = 'anthropic'
    apiKey = ANTHROPIC_API_KEY
    model = 'claude-haiku-4-5'
  } else if (GROQ_API_KEY !== undefined) {
    provider = 'groq'
    apiKey = GROQ_API_KEY
    model = GROQ_MODEL
  }

  if (provider === null || apiKey === undefined) {
    return NextResponse.json(
      {
        error: 'No LLM API key set',
        hint:
          'Set ANTHROPIC_API_KEY, or GROQ_API_KEY for the free Groq tier ' +
          '(console.groq.com) - see .env.example.',
      },
      { status: 503 },
    )
  }

  const systemPrompt = scenario === 'rwa' ? RWA_SYSTEM_PROMPT : PENDLE_SYSTEM_PROMPT
  const toolDefinition = scenario === 'rwa' ? RWA_TOOL_DEFINITION : PENDLE_TOOL_DEFINITION

  let turn: AgentTurn
  try {
    turn = await runAgentTurn({
      provider,
      apiKey,
      model,
      systemPrompt,
      tool: toolDefinition,
      messages,
    })
  } catch (modelError) {
    return NextResponse.json(
      { error: 'Model call failed', detail: String(modelError) },
      { status: 502 },
    )
  }

  const { textReply, toolName, toolInput } = turn

  // No tool call - the model is asking for clarification or refusing.
  if (toolName === undefined) {
    return NextResponse.json({
      reply: textReply,
      scenario,
    })
  }

  if (scenario !== 'pendle') {
    return NextResponse.json(
      {
        error: 'RWA scenario not implemented yet',
        detail: 'The RWA scenario is not implemented in this build.',
      },
      { status: 501 },
    )
  }

  if (toolName !== 'prepare_pendle_yield_swap') {
    return NextResponse.json(
      {
        error: `Unexpected tool call: ${toolName}`,
        detail: 'Only prepare_pendle_yield_swap is wired in the Pendle scenario.',
      },
      { status: 502 },
    )
  }

  const argsParse = preparePendleYieldSwapArgs.safeParse(toolInput ?? {})
  if (!argsParse.success) {
    return NextResponse.json(
      {
        error: 'Invalid tool args from Claude',
        detail: argsParse.error.flatten(),
        rawInput: toolInput,
      },
      { status: 422 },
    )
  }

  let envelope: DemoEnvelope
  try {
    envelope = buildPendleEnvelope(argsParse.data, receiverAddress)
  } catch (buildError) {
    return NextResponse.json(
      {
        error: 'Envelope build failed',
        detail: String(buildError),
        hint:
          'Most often this means MockPendleRouter or AgentPolicyGate is not deployed yet. ' +
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
    const gateAddress = getAgentPolicyGateAddress(ARBITRUM_SEPOLIA_CHAIN_ID)
    const signature = await signEnvelope({
      envelopeHash: meta.envelopeHash,
      to: inner.to,
      data: inner.data,
      value: BigInt(inner.value),
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
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
  })
}
