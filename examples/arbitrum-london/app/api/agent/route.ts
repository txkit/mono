import { NextResponse, type NextRequest } from 'next/server'

import { getEnv } from '@/src/config/env'


export const runtime = 'nodejs'

/**
 * Phase 1 Day 3 milestone: minimum-viable Claude SDK echo.
 *
 * V1 contract:
 *   POST /api/agent { messages: [{ role, content }] }
 *   -> { reply: string, envelope?: DemoEnvelope }
 *
 * For the Day 3 milestone we only echo the user message back through
 * Claude with no tools attached - confirms Node runtime + env loading +
 * Anthropic SDK plumbing works end to end. Tool calls + envelope return
 * land in Day 4 (Pendle) and Day 10 (RWA).
 *
 * The SDK is dynamically imported inside the handler so the route module
 * stays importable even when ANTHROPIC_API_KEY is unset (better DX for
 * the first contributor cloning the repo).
 */
type AgentRequestBody = {
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  scenario?: 'pendle' | 'rwa',
}

export const POST = async (request: NextRequest) => {
  let body: AgentRequestBody
  try {
    body = (await request.json()) as AgentRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 })
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

  if (env.ANTHROPIC_API_KEY === undefined) {
    return NextResponse.json(
      {
        error: 'ANTHROPIC_API_KEY not set',
        hint: 'Add ANTHROPIC_API_KEY to .env.local - see .env.example for the full list',
      },
      { status: 503 },
    )
  }

  // Dynamic import keeps the route module loadable without the SDK installed.
  // Day 4 will replace this with the full Agent SDK + tool-use loop.
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

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  try {
    const completion = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system:
        'You are a placeholder echo agent. Day 4 replaces you with the full Pendle tool-use loop. Reply briefly to confirm the pipeline works.',
      messages: body.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    })

    const reply = completion.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { type: string, text?: string }) => block.text ?? '')
      .join('\n')

    return NextResponse.json({
      reply,
      scenario: body.scenario ?? 'pendle',
      milestone: 'phase-1-day-3-echo',
    })
  } catch (modelError) {
    return NextResponse.json(
      { error: 'Anthropic call failed', detail: String(modelError) },
      { status: 502 },
    )
  }
}
