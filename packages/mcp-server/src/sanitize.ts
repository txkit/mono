import type { ZodType } from 'zod'


/**
 * Surface for sanitization rejections. Returned shape avoids leaking
 * internal stack traces or schema details to the agent caller.
 */
export type SanitizationError = {
  code: 'INVALID_INPUT' | 'BLOCKED_PATTERN' | 'TOO_LARGE'
  message: string
}

export type SanitizeResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SanitizationError }

/**
 * Patterns that are unconditionally rejected from tool inputs regardless of
 * schema. Defense in depth against the Anthropic MCP SDK architectural RCE
 * family (CVE-2026-30615 / 30623): even though our tools never invoke a
 * shell, we strip these before any downstream code touches them.
 *
 * Rationale: every published DeFi MCP we've audited (dcSpark crypto-wallet-evm,
 * DeFi Trading Agent, Blockchain Payment MCP, Self-Custodial Portfolio) was
 * built on vulnerable SDK templates. We assume any tool surface we expose may
 * be wrapped by a downstream layer that does invoke a shell.
 */
const BLOCKED_PATTERNS: ReadonlyArray<RegExp> = [
  /\$\(/,           // command substitution
  /`[^`]*`/,        // backtick command substitution
  /\${[^}]*}/,      // ${...} substitution
  /;\s*\w/,         // chained shell commands
  /\|\s*\w/,        // pipe to command
  /<\s*\(/,         // process substitution
  />\s*[\w/]/,      // file redirection
  /\\x[0-9a-f]{2}/i, // hex escape
  /\\u00[0-9a-f]{2}/i, // suspicious unicode escape
]

const MAX_INPUT_BYTES = 64 * 1024

/**
 * Recursively check every string in a value against blocked patterns.
 * Returns the first error found, or null if clean.
 */
const findBlockedPattern = (value: unknown, path = ''): SanitizationError | null => {
  if (typeof value === 'string') {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(value)) {
        return {
          code: 'BLOCKED_PATTERN',
          message: `Input rejected by sanitizer at ${path || 'root'} (matched ${pattern.source}).`,
        }
      }
    }
    return null
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const error = findBlockedPattern(value[index], `${path}[${index}]`)
      if (error) {
        return error
      }
    }
    return null
  }

  if (value && typeof value === 'object') {
    for (const [ key, child ] of Object.entries(value)) {
      const error = findBlockedPattern(child, path ? `${path}.${key}` : key)
      if (error) {
        return error
      }
    }
  }

  return null
}

/**
 * Validate input against a Zod schema AND scan all string leaves for
 * shell-injection patterns. Returns a typed value or a redacted error.
 *
 * Always call this before any tool implementation touches user input.
 */
export const sanitize = <T>(schema: ZodType<T>, raw: unknown): SanitizeResult<T> => {
  const serialized = JSON.stringify(raw ?? null)
  if (serialized.length > MAX_INPUT_BYTES) {
    return {
      ok: false,
      error: { code: 'TOO_LARGE', message: `Input exceeds ${MAX_INPUT_BYTES} bytes.` },
    }
  }

  const blocked = findBlockedPattern(raw)
  if (blocked) {
    return { ok: false, error: blocked }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; '),
      },
    }
  }

  return { ok: true, value: parsed.data }
}

export const __test_only = { BLOCKED_PATTERNS, MAX_INPUT_BYTES, findBlockedPattern }
