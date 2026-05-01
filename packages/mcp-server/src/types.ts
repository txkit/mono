import type { ZodType } from 'zod'

import type { SanitizationError } from './sanitize'


export type ToolResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SanitizationError | { code: string; message: string } }

export type ToolDefinition<TInput, TOutput = unknown> = {
  /** Tool identifier exposed to MCP clients. snake_case, intent-based. */
  name: string
  /** Human-readable summary for the MCP capability listing. */
  description: string
  /** Zod schema applied via the `sanitize` helper before the handler runs. */
  schema: ZodType<TInput>
  /** Handler called only with sanitized input. Must not invoke shells or fs writes. */
  handler: (input: TInput) => Promise<ToolResult<TOutput>>
}

/**
 * Server config. Defaults are deliberately conservative.
 */
export type ServerOptions = {
  /** Tool registry. Defaults to `DEFAULT_TOOLS` if omitted. */
  tools?: ReadonlyArray<ToolDefinition<unknown>>
  /** Hard ceiling on response size (bytes) before truncation. Default: 500 KB - matches Claude Code 2.1.116 maxResultSizeChars. */
  maxResponseBytes?: number
  /** Hard ceiling on inbound request body size (bytes). Default: 1 MB. Enforced by the HTTP transport before parsing. */
  maxRequestBytes?: number
  /** Suppress all logger output. Use this in tests instead of relying on NODE_ENV. */
  silent?: boolean
  /** Logger sink. All logs go to stderr (stdout discipline for stdio MCP). */
  logger?: (level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void
}
