import { DEFAULT_TOOLS } from './tools'
import type { ServerOptions, ToolDefinition, ToolResult } from './types'


const DEFAULT_MAX_RESPONSE_BYTES = 500 * 1024
const DEFAULT_MAX_REQUEST_BYTES = 1 * 1024 * 1024

const NOOP_LOGGER: NonNullable<ServerOptions['logger']> = () => undefined

const stderrLogger: NonNullable<ServerOptions['logger']> = (level, message, context) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, message, context })
   
  console.error(line)
}

/**
 * Build a per-request server instance. Sessions are isolated - no shared
 * mutable state between requests. Construct one server per stdio process
 * (long-lived) or one per HTTP request (short-lived) depending on transport.
 */
export const createServer = (options: ServerOptions = {}) => {
  const tools = options.tools ?? DEFAULT_TOOLS
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES
  const maxRequestBytes = options.maxRequestBytes ?? DEFAULT_MAX_REQUEST_BYTES
  const explicitLogger = options.logger
  const logger = explicitLogger ?? (options.silent ? NOOP_LOGGER : stderrLogger)

  const toolsByName: Record<string, ToolDefinition<unknown>> = {}
  for (const tool of tools) {
    toolsByName[tool.name] = tool
  }

  const listTools = () => {
    return tools.map((tool) => ({ name: tool.name, description: tool.description }))
  }

  const callTool = async (name: string, input: unknown): Promise<ToolResult<unknown>> => {
    const tool = toolsByName[name]
    if (!tool) {
      logger('warn', 'unknown_tool', { name })
      return { ok: false, error: { code: 'UNKNOWN_TOOL', message: `Tool ${JSON.stringify(name)} is not registered.` } }
    }

    // Enforce input size before the schema runs. Per-tool sanitize already
    // checks each leaf, but a multi-MB input could chew CPU on its way
    // there. The dispatcher boundary is the right place to short-circuit.
    let serializedInput: string
    try {
      serializedInput = JSON.stringify(input)
    } catch {
      return { ok: false, error: { code: 'INPUT_NOT_SERIALIZABLE', message: 'Tool input could not be serialized.' } }
    }
    if (serializedInput.length > maxRequestBytes) {
      logger('warn', 'request_too_large', { tool: name, size: serializedInput.length, limit: maxRequestBytes })
      return { ok: false, error: { code: 'REQUEST_TOO_LARGE', message: `Request exceeded ${maxRequestBytes} bytes.` } }
    }

    try {
      const result = await tool.handler(input)
      const serialized = JSON.stringify(result)
      if (serialized.length > maxResponseBytes) {
        logger('warn', 'response_truncated', { tool: name, size: serialized.length, limit: maxResponseBytes })
        return { ok: false, error: { code: 'RESPONSE_TOO_LARGE', message: `Response exceeded ${maxResponseBytes} bytes.` } }
      }
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      logger('error', 'tool_threw', { tool: name, message })
      return { ok: false, error: { code: 'TOOL_INTERNAL_ERROR', message: 'Tool failed - check server logs.' } }
    }
  }

  return { callTool, listTools }
}

export type Server = ReturnType<typeof createServer>
