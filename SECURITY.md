# Security Policy

## Reporting a Vulnerability

txKit is a Web3 UI library that handles wallet connections, token approvals, and transaction signing. Security is critical.

**Do NOT open a public issue for security vulnerabilities.**

Instead, please report them via email: **security@txkit.dev**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: within 48 hours
- **Assessment**: within 7 days
- **Fix**: critical issues within 14 days, others within 30 days

## Scope

The following are in scope:
- XSS or injection via component props
- Transaction manipulation (calldata, amounts, recipients)
- Approval flow bypasses (e.g., MAX_UINT256 when bounded approval expected)
- Private key or sensitive data exposure
- Phishing attack vectors through component UI

The following are out of scope:
- Vulnerabilities in dependencies (report to the dependency maintainer)
- Issues requiring physical access to a user's device
- Social engineering attacks

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Hardening posture

### txKit core invariants

- **No key custody.** No package in this monorepo holds, derives, or persists a private key, mnemonic, or signing material. Signing always happens in the user's wallet, OWS implementation, MPC service, or hardware device.
- **No order routing.** txKit does not execute trades, route to specific liquidity venues, or take a fee on trade flow at the protocol layer.
- **No telemetry by default.** No events, IDs, or addresses are sent to txKit-controlled endpoints from any package in this monorepo. Optional fiat-pricing fetches go to `coins.llama.fi` and `frankfurter.app` directly from the user's browser.
- **Off-chain fields carry no integrity guarantee on their own.** The authoritative representation of on-chain effect in `@txkit/tx-protocol` is the raw `{chain, calls[*].to, calls[*].data, calls[*].value}` tuple (or `{scheme, domain, message}` for signatures). Decoded `description`, `metadata`, `origin`, `risk`, `decoderRef`, `clearSigning`, `meta` are presentational. Integrity comes from the optional `producer.signature` over the envelope (post-quantum schemes reserved) plus consumer-side decoder re-verification.

### Publishing and supply chain

- **npm provenance** is not yet attached to published tarballs. The source repository is private during the v0.1.0-alpha cycle, and npm provenance rejects private GitHub sources. Provenance attestation enables on the v0.1.0 GA cut once the source repository migrates to public.
- **Publishing flow.** Releases run through GitHub Actions (`.github/workflows/release.yml`) on every published GitHub Release with a `v*` tag. The publishing account is gated by 2FA; the workflow uses an npm token stored as a GitHub Actions secret with OIDC-restricted permissions (`id-token: write`) so a future provenance switch is a one-line change.
- **No manual publishes.** The intent is that no maintainer ever runs `npm publish` from a workstation; tag-driven CI is the only authorized publisher.

### `@txkit/mcp-server` posture (when published)

The MCP server package is **not yet published**. The hardening contract below is the design constraint for shipping it, in response to the Anthropic MCP SDK architectural RCE family disclosed by Ox Security in April 2026.

- **Sandboxed execution.** The server runs in a sandboxed worker (Deno default-deny permissions or Node.js `worker_thread`). No filesystem write access outside a scoped temp dir.
- **Zod sanitization on every tool input.** No user-controlled string is passed to a shell, an `exec`, a child-process command, or an unvalidated SQL/Cypher path. Inputs are validated against a Zod schema before any side effect.
- **Narrow, intent-based tools only.** No generic `shell`, `eval`, or arbitrary-RPC tool. Tools are scoped to `prepare_*`, `decode_tx`, `simulate_tx`, `get_*`. Each tool has an allowlist of effects.
- **Per-request session isolation.** Tool state does not leak between requests. No shared mutable singletons.
- **Uniform middleware application.** No selective middleware bypass on backup or alternate endpoints (MCPwn CVE-2026-33032 lesson - 2,689 instances exploited via this pattern).
- **No backup or alternate endpoint exposure.** Single transport surface per deployment mode.
- **stdout discipline.** Only JSON-RPC messages on stdout. All logs go to stderr. (Claude Code 2.1.116 strict-mode requirement.)
- **Container image** ships as a Docker Hardened Image candidate when the catalog opens for community submissions: minimal base, SBOM, SLSA Level 3 provenance.
- **Third-party verification.** Snyk Agent Scan (formerly Invariant MCP-Scan, acquired June 2025) clean run, Glama grade A, registry namespace verified at `io.github.txkit/*`.

### CVE advisories - "not affected because..."

The following published CVEs are explicitly tracked. Each entry states why the relevant txKit package is not affected, or links to the fix when it was.

| CVE | Component | Status |
|-----|-----------|--------|
| CVE-2026-30615 / 30623 (Anthropic MCP SDK arch RCE family) | `@txkit/mcp-server` (unpublished) | Not affected. Server design uses sanitized Zod schemas for all tool inputs and narrow intent-based tools - no generic shell or `exec` path. Sandboxed worker with default-deny permissions. |
| CVE-2026-33032 (MCPwn middleware bypass) | `@txkit/mcp-server` (unpublished) | Not affected. Single transport surface per deployment mode, uniform middleware application, no alternate endpoint exposure. |
| Shai-Hulud npm supply chain (Sep 2025) | All packages | Not affected. Audited 2026-04-14: zero direct exposure, no compromised packages in `pnpm-lock.yaml`. `pnpm.overrides` in place for transitive deps (axios 1.15.0+, vite 8.0.8+, follow-redirects 1.16.0+, picomatch 4.0.4+, brace-expansion 5.0.5+, defu 6.1.7+, yaml 2.8.3+, h3 1.15.11+, lodash 4.18.1+, hono 4.12.12+, @hono/node-server 1.19.14+). |
| Axios v1.14.1 / v0.30.4 RAT (UNC1069, Apr 2026) | All packages | Not affected. Lockfile resolves `axios@1.15.0` via `pnpm.overrides`. |
| LiteLLM CVE-2026-30623 | All packages | Not affected. txKit does not depend on LiteLLM. |

### Reporting CVE applicability questions

If you believe a published CVE applies to a txKit package and is not addressed above, please email **security@txkit.dev** with:

- The CVE identifier
- The affected package name and version
- The attack path (with code references if possible)

We will respond within 48 hours and update this document with either a not-affected justification or a remediation plan.

## Recognition

We appreciate responsible disclosure. Contributors who report valid security issues will be credited in the release notes (unless they prefer to remain anonymous).
