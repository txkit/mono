# @txkit/mcp-server

[![npm](https://img.shields.io/npm/v/@txkit/mcp-server/alpha.svg)](https://www.npmjs.com/package/@txkit/mcp-server)
[![license](https://img.shields.io/npm/l/@txkit/mcp-server.svg)](https://github.com/txkit/mono/blob/main/LICENSE)

Hardened MCP server for AI agents to prepare, decode, and simulate Web3 transactions. Zod-sanitized tool inputs, narrow intent-based surface, no shell access, stdio + HTTP transports. Built post-CVE-2026-30615.

> **v0.1.0-alpha** - skeleton. Tool surface intentionally minimal at v0.1; expands as the prepare/decode/simulate triad lands.

## Why this exists

In April 2026 Ox Security disclosed an architectural RCE family in the Anthropic MCP SDK (CVE-2026-30615 / 30623). Anthropic's response: "by design - sanitization is the developer's responsibility." Microsoft now recommends putting an API gateway in front of every remote MCP server.

Every published DeFi MCP we've audited (dcSpark crypto-wallet-evm, DeFi Trading Agent, Blockchain Payment MCP, Self-Custodial Portfolio) was built on the vulnerable SDK templates. txKit ships post-CVE-compliant from day one.

## Hardening posture

The server enforces these constraints by construction:

- **Zod sanitization on every tool input** before the handler runs. No string from a tool argument touches downstream code without schema validation.
- **Blocked-pattern scan on every string leaf** (recursive). Rejects `$(...)`, backticks, `${...}`, `;cmd`, `|cmd`, `<(...)`, `>file`, hex / unicode escapes. Defense in depth even though tools never invoke a shell.
- **Narrow, intent-based tools only.** No generic `shell`, `eval`, `exec`, or arbitrary-RPC tool. Tools are `prepare_*`, `decode_tx`, `simulate_tx`, `get_*`. Each tool has an explicit allowlist of effects.
- **Per-request session isolation.** No shared mutable singletons. `createServer` returns a fresh instance with its own tool registry; cross-request state is impossible by design.
- **stdout discipline.** stdio transport writes only JSON-RPC 2.0 frames to stdout. All logs go to stderr. Required by Claude Code 2.1.116 strict-mode (any non-JSON line in stdout triggers automatic disconnect).
- **No filesystem write access** outside a scoped temp dir.
- **Response size cap** (default 500 KB, matches Claude Code 2.1.116 `maxResultSizeChars`). Oversized responses fail closed.
- **Handler exceptions are caught and redacted.** Internal error messages never reach the agent caller.
- **Uniform middleware application** on HTTP transport. No selective bypass on alternate endpoints (MCPwn CVE-2026-33032 lesson - 2,689 instances exploited via this pattern).

## Install

```bash
npm install @txkit/mcp-server@alpha @txkit/tx-protocol@alpha
```

## Usage

### stdio transport (Claude Code, Codex CLI, Gemini ADK)

```ts
import { createServer, runStdio } from '@txkit/mcp-server'

const server = createServer()
runStdio(server)
```

Or as a CLI:

```bash
npx @txkit/mcp-server
```

### HTTP transport (AWS Bedrock AgentCore, OpenAI Tool Use)

```ts
import { createServer, createHttpHandler } from '@txkit/mcp-server'
import { Hono } from 'hono'

const server = createServer()
const handler = createHttpHandler(server)

const app = new Hono()
app.post('/mcp', async (c) => {
  const body = await c.req.json()
  const response = await handler(body)
  return c.json(response.body, response.status)
})
```

### Custom tool registry

```ts
import { createServer, prepareEvmTxTool } from '@txkit/mcp-server'

const server = createServer({
  tools: [ prepareEvmTxTool, /* ...your custom tools */ ],
  maxResponseBytes: 256 * 1024,
})
```

## Tool surface (v0.1.0-alpha)

| Tool | Status | Description |
|------|--------|-------------|
| `prepare_evm_tx` | implemented | Build a `PreparedEnvelope` (kind: `evm-tx`) for a single EVM transaction. |
| `prepare_evm_batch` | planned | EIP-5792 batch envelope. |
| `prepare_signature` | planned | EIP-712 / SIWE / personal-sign envelope. |
| `decode_tx` | planned | Calldata → human-readable tree (calls `@txkit/tx-decoder`). |
| `simulate_tx` | planned | `eth_call` simulation result (opt-in via injected RPC URL). |
| `get_position`, `get_apy`, `list_vaults` | planned | Read-layer adapters per protocol. |

## CVE advisories - "not affected because..."

See [SECURITY.md](https://github.com/txkit/mono/blob/main/SECURITY.md) for the full list. Highlights:

- **CVE-2026-30615 / 30623 (Anthropic MCP SDK arch RCE family)** - not affected. We do not use the Anthropic MCP SDK as transport. Built on a thin custom JSON-RPC layer with sanitization-first defaults.
- **MCPwn CVE-2026-33032** - not affected. Single transport surface per deployment, uniform middleware, no alternate endpoint exposure.

## Distribution roadmap

- npm primary (`@txkit/mcp-server`)
- AWS Bedrock AgentCore tool catalog (HTTP transport, ~28-30 Apr 2026 when AgentCore Skills ship)
- Self-hosted Docker image (community submission to Docker Hardened Images catalog when expanded)
- Snyk Agent Scan clean run, Glama grade A, registry namespace `io.github.txkit/*`

## License

[MIT](./LICENSE)
