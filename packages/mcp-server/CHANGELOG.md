# @txkit/mcp-server

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release. Hardened MCP server for AI agents to prepare, decode, and simulate Web3 transactions. Built post-CVE-2026-30615 with no runtime dep on `@modelcontextprotocol/sdk` or related vulnerable templates.

- Hardened JSON-RPC 2.0 MCP server, no runtime dep on `@modelcontextprotocol/sdk` or related vulnerable templates
- Zod-sanitized tool inputs with recursive blocked-pattern scan (rejects shell substitution, hex/unicode escapes, oversized payloads)
- Narrow tool surface: v0.1 ships `prepare_evm_tx` only - no generic shell, eval, or RPC tools
- Per-request session isolation via `createServer` factory
- stdio transport with strict stdout discipline (JSON-RPC frames only; logs to stderr) - compatible with Claude Code 2.1.116 strict-mode
- HTTP transport handler (runtime-agnostic, composes with Hono / Express / Fastify) - target for AWS Bedrock AgentCore Managed Harness
- Response size cap (default 500 KB, matches Claude Code `maxResultSizeChars`)
- Handler exceptions caught and redacted - internal error messages never reach the caller
- 14 vitest tests covering sanitization (10) and server dispatch (4) including error-redaction and oversized-response paths
- CLI binary `txkit-mcp` for `npx` deployment
- Built-in CVE advisory tracking in README + SECURITY.md ("not affected because...")
- Depends only on `zod` (runtime) and `@txkit/tx-protocol` (workspace)
