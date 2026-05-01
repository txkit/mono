import type { Server } from '../server'


/**
 * Skeleton MCP-over-HTTP request handler. AWS Bedrock AgentCore (Managed
 * Harness Preview, 22 Apr 2026) requires HTTP transport - stdio does not
 * work in the managed-service execution model.
 *
 * This is a runtime-agnostic shape: it takes a parsed body and returns a
 * response object, so it composes with any HTTP framework (Hono, Express,
 * Fastify, Node http). The framework integration lives in user code so we
 * do not pull a runtime web-framework dependency into the package.
 *
 * Security posture (per action-plan items 47, 48, 53, 62):
 *   - single transport surface per deployment - do not expose stdio AND
 *     HTTP from the same process
 *   - uniform middleware - no selective bypass on alternate endpoints
 *     (MCPwn CVE-2026-33032 lesson)
 *   - per-request server instance is acceptable because `createServer`
 *     does not allocate or persist any cross-request state
 */
export type HttpHandler = (body: unknown) => Promise<HttpResponse>

export type HttpResponse = {
  status: 200 | 400 | 405 | 500
  headers: Record<string, string>
  body: unknown
}

export const createHttpHandler = (server: Server): HttpHandler => {
  return async (body) => {
    if (!body || typeof body !== 'object') {
      return {
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: { error: 'Invalid JSON body' },
      }
    }

    const request = body as { method?: string; params?: { name?: string; arguments?: unknown } }

    if (request.method === 'tools/list') {
      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: { tools: server.listTools() },
      }
    }

    if (request.method === 'tools/call') {
      if (!request.params?.name) {
        return {
          status: 400,
          headers: { 'content-type': 'application/json' },
          body: { error: 'Missing tool name' },
        }
      }
      const result = await server.callTool(request.params.name, request.params.arguments)
      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: result,
      }
    }

    return {
      status: 405,
      headers: { 'content-type': 'application/json' },
      body: { error: `Unsupported method: ${request.method ?? '(missing)'}` },
    }
  }
}
