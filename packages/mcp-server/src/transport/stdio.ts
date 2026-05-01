import { createInterface } from 'node:readline'

import type { Server } from '../server'


type JsonRpcRequest = {
  jsonrpc: '2.0'
  id: number | string
  method: string
  params?: unknown
}

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: number | string | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

const writeJsonRpc = (response: JsonRpcResponse): void => {
  /* stdout discipline: only JSON-RPC frames. All logs go to stderr - this is required by Claude Code 2.1.116 strict-mode stdio MCP servers (any non-JSON line in stdout triggers automatic disconnect). */
  process.stdout.write(`${JSON.stringify(response)}\n`)
}

const handleRequest = async (server: Server, raw: string): Promise<JsonRpcResponse | null> => {
  let request: JsonRpcRequest
  try {
    request = JSON.parse(raw)
  } catch {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    }
  }

  if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    return {
      jsonrpc: '2.0',
      id: request.id ?? null,
      error: { code: -32600, message: 'Invalid request' },
    }
  }

  if (request.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools: server.listTools() },
    }
  }

  if (request.method === 'tools/call') {
    const params = request.params as { name?: string; arguments?: unknown } | undefined
    if (!params?.name) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32602, message: 'Missing tool name' },
      }
    }
    const result = await server.callTool(params.name, params.arguments)
    return {
      jsonrpc: '2.0',
      id: request.id,
      result,
    }
  }

  return {
    jsonrpc: '2.0',
    id: request.id,
    error: { code: -32601, message: `Method not found: ${request.method}` },
  }
}

/**
 * Run the server on stdio. JSON-RPC 2.0 line-delimited frames in/out.
 * Process exits when stdin closes.
 */
export const runStdio = (server: Server): void => {
  const reader = createInterface({ input: process.stdin })

  reader.on('line', (line) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return
    }
    handleRequest(server, trimmed)
      .then((response) => {
        if (response) {
          writeJsonRpc(response)
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'unknown error'
         
        console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', message }))
      })
  })

  reader.on('close', () => {
    process.exit(0)
  })
}
