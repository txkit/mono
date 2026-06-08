import type Anthropic from '@anthropic-ai/sdk'


/**
 * Provider-agnostic single agent turn. Everything downstream of the model call
 * (zod validation, envelope build, EIP-712 signing) is identical regardless of
 * who produced the tool call, so this module is the only place that knows about
 * a specific LLM vendor.
 *
 * Three providers:
 *   - groq: the free, OpenAI-compatible Groq endpoint (a plain fetch). Any
 *     OpenAI-compatible host (Gemini, OpenRouter) slots in by swapping the URL.
 *   - kie: kie.ai's Anthropic Messages-compatible Claude endpoint (a plain fetch
 *     with Bearer auth - the SDK's extra headers trip kie's gateway with a 403).
 *   - anthropic: Claude via @anthropic-ai/sdk (dynamically imported so the route
 *     stays loadable without the key/SDK).
 *
 * The tool is described once in Anthropic shape (tools.ts) and translated to the
 * OpenAI function shape for Groq, so there is a single source of truth.
 */

export type AgentProvider = 'anthropic' | 'groq' | 'kie'

export type AgentTurn = {
  textReply: string,
  toolName: string | undefined,
  toolInput: Record<string, unknown> | undefined,
}

type ChatMessage = {
  role: 'user' | 'assistant',
  content: string,
}

type RunAgentTurnParams = {
  provider: AgentProvider,
  apiKey: string,
  model: string,
  systemPrompt: string,
  tool: Anthropic.Tool,
  messages: ChatMessage[],
}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const KIE_CLAUDE_URL = 'https://api.kie.ai/claude/v1/messages'
const MAX_TOKENS = 1024

// ----- Anthropic (Claude) -----

type AnthropicToolUseBlock = {
  type: 'tool_use',
  id: string,
  name: string,
  input: Record<string, unknown>,
}

type AnthropicTextBlock = {
  type: 'text',
  text: string,
}

type AnthropicBlock = AnthropicToolUseBlock | AnthropicTextBlock | { type: string }

const checkIsAnthropicToolUse = (block: AnthropicBlock): block is AnthropicToolUseBlock => {
  return block.type === 'tool_use'
}

const checkIsAnthropicText = (block: AnthropicBlock): block is AnthropicTextBlock => {
  return block.type === 'text'
}

const blocksToTurn = (blocks: AnthropicBlock[]): AgentTurn => {
  const textReply = blocks
    .filter(checkIsAnthropicText)
    .map((block) => block.text)
    .join('\n')
  const toolUse = blocks.find(checkIsAnthropicToolUse)

  return {
    textReply,
    toolName: toolUse?.name,
    toolInput: toolUse?.input,
  }
}

const runAnthropicTurn = async (params: RunAgentTurnParams): Promise<AgentTurn> => {
  const { apiKey, model, systemPrompt, tool, messages } = params

  const imported = await import('@anthropic-ai/sdk').catch(() => null)
  if (imported === null) {
    throw new Error('@anthropic-ai/sdk not installed - run pnpm install in the workspace root')
  }

  const AnthropicSdk = imported.default
  const anthropic = new AnthropicSdk({ apiKey })
  const completion = await anthropic.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: systemPrompt,
    tools: [ tool ],
    messages: messages.map((message) => ({ role: message.role, content: message.content })),
  })

  return blocksToTurn(completion.content as AnthropicBlock[])
}

/**
 * kie.ai's Anthropic Messages-compatible Claude endpoint. Plain fetch with
 * Bearer auth - @anthropic-ai/sdk sends x-stainless-* / user-agent headers that
 * kie's gateway blocks with a 403, while the bare Messages request works and
 * returns the same content blocks.
 */
const runKieTurn = async (params: RunAgentTurnParams): Promise<AgentTurn> => {
  const { apiKey, model, systemPrompt, tool, messages } = params

  const response = await fetch(KIE_CLAUDE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: systemPrompt,
      tools: [ tool ],
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`kie.ai call failed: ${response.status} ${detail.slice(0, 200)}`)
  }

  const json = (await response.json()) as { content?: AnthropicBlock[] }

  return blocksToTurn(json.content ?? [])
}

// ----- Groq (OpenAI-compatible) -----

type GroqToolCall = {
  function: {
    name: string,
    arguments: string,
  },
}

type GroqChoice = {
  message: {
    content: string | null,
    tool_calls?: GroqToolCall[],
  },
}

type GroqResponse = {
  choices?: GroqChoice[],
  error?: { message?: string },
}

const parseToolArguments = (raw: string): Record<string, unknown> => {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

const runGroqTurn = async (params: RunAgentTurnParams): Promise<AgentTurn> => {
  const { apiKey, model, systemPrompt, tool, messages } = params

  const openAiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ]
  const openAiTool = {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      messages: openAiMessages,
      tools: [ openAiTool ],
      tool_choice: 'auto',
    }),
  })

  const json = (await response.json()) as GroqResponse
  if (!response.ok) {
    const detail = json.error?.message ?? `HTTP ${response.status}`
    throw new Error(`Groq call failed: ${detail}`)
  }

  const choice = json.choices?.[0]
  const toolCall = choice?.message.tool_calls?.[0]
  const toolInput = toolCall !== undefined ? parseToolArguments(toolCall.function.arguments) : undefined

  return {
    textReply: choice?.message.content ?? '',
    toolName: toolCall?.function.name,
    toolInput,
  }
}

export const runAgentTurn = async (params: RunAgentTurnParams): Promise<AgentTurn> => {
  if (params.provider === 'groq') {
    return runGroqTurn(params)
  }
  if (params.provider === 'kie') {
    return runKieTurn(params)
  }

  return runAnthropicTurn(params)
}
