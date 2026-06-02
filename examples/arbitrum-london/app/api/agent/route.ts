import { NextResponse, type NextRequest } from 'next/server'
import type { Hex } from 'viem'

import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import {
  attachAgentSignature,
  buildPendleEnvelope,
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
 *   1. Claude reads PENDLE_SYSTEM_PROMPT + receives PENDLE_TOOL_DEFINITION.
 *   2. If args are clear: Claude calls prepare_pendle_yield_swap.
 *   3. We validate via zod, buildPendleEnvelope, sign EIP-712 via signEnvelope,
 *      attach signature, return both the assistant's text reply (if any) and
 *      the signed envelope.
 *   4. If Claude asks for clarification (text only): return reply, no envelope.
 *
 * RWA flow lands Phase 2 Day 10.
 *
 * The SDK is dynamically imported inside the handler so the route module
 * stays loadable even when ANTHROPIC_API_KEY is unset (better DX for the
 * first contributor cloning the repo).
 */
const DEFAULT_RECEIVER = '0x000000000000000000000000000000000000dEaD' as const

type AgentRequestBody = {
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  scenario?: 'pendle' | 'rwa',
  receiverAddress?: `0x${string}`,
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
      { error: 'Anthropic call failed', detail: String(modelError) },
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
      milestone: 'phase-1-day-5-tool-use-text-only',
    })
  }

  if (scenario !== 'pendle') {
    return NextResponse.json(
      {
        error: 'RWA scenario not implemented yet',
        detail: 'Phase 2 Day 10 wires the RWA envelope builder + Robinhood Chain deploy.',
      },
      { status: 501 },
    )
  }

  const { name: toolName, input: toolInput } = toolUseBlock

  if (toolName !== 'prepare_pendle_yield_swap') {
    return NextResponse.json(
      {
        error: `Unexpected tool call: ${toolName}`,
        detail: 'Only prepare_pendle_yield_swap is wired in the Pendle scenario.',
      },
      { status: 502 },
    )
  }

  const argsParse = preparePendleYieldSwapArgs.safeParse(toolInput)
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
    milestone: 'phase-1-day-5-tool-use-with-envelope',
  })
}
