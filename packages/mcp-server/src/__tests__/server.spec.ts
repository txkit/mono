import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createServer } from '../server'
import type { ToolDefinition } from '../types'


const echoTool: ToolDefinition<{ message: string }> = {
  name: 'echo',
  description: 'Echo back the message field. Test-only.',
  schema: z.object({ message: z.string().min(1).max(100) }),
  handler: async (input) => ({ ok: true, value: { echo: input.message } }),
}

describe('createServer', () => {
  it('lists registered tools', () => {
    const server = createServer({ tools: [ echoTool as unknown as ToolDefinition<unknown> ] })
    const tools = server.listTools()
    expect(tools).toHaveLength(1)
    expect(tools[0]?.name).toBe('echo')
  })

  it('dispatches tool calls', async () => {
    const server = createServer({ tools: [ echoTool as unknown as ToolDefinition<unknown> ] })
    const result = await server.callTool('echo', { message: 'hello' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toMatchObject({ echo: 'hello' })
    }
  })

  it('returns UNKNOWN_TOOL for unregistered name', async () => {
    const server = createServer({ tools: [ echoTool as unknown as ToolDefinition<unknown> ] })
    const result = await server.callTool('mystery', {})
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('UNKNOWN_TOOL')
    }
  })

  it('returns RESPONSE_TOO_LARGE when output exceeds limit', async () => {
    const fatTool: ToolDefinition<unknown> = {
      name: 'fat',
      description: 'returns a large blob',
      schema: z.unknown(),
      handler: async () => ({ ok: true, value: 'x'.repeat(2 * 1024) }),
    }
    const server = createServer({
      tools: [ fatTool ],
      maxResponseBytes: 1024,
    })
    const result = await server.callTool('fat', {})
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('RESPONSE_TOO_LARGE')
    }
  })

  it('catches handler exceptions without leaking stack details', async () => {
    const brokenTool: ToolDefinition<unknown> = {
      name: 'broken',
      description: 'throws',
      schema: z.unknown(),
      handler: async () => {
        throw new Error('internal: secret context')
      },
    }
    const server = createServer({ tools: [ brokenTool ] })
    const result = await server.callTool('broken', {})
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('TOOL_INTERNAL_ERROR')
      expect(result.error.message).not.toContain('secret context')
    }
  })
})
