# Contributing to txKit

Thank you for your interest in contributing to txKit! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/txkit/mono.git
cd mono

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start dev mode
pnpm dev
```

## Project Structure

```
packages/
  core/          - Framework-agnostic types, utilities, constants
  react/         - React components and hooks
  themes/        - CSS themes and visual variants
  tx-protocol/   - Open PreparedTransaction protocol (types + zod schemas)
  tx-decoder/    - Decode raw EVM calldata into clearSigning trees
  ows-adapter/   - Bridge MoonPay Open Wallet Standard <-> PreparedTransaction
  x402-adapter/  - Bridge x402 HTTP payments <-> PreparedTransaction
  mcp-server/    - Hardened MCP server (unpublished, see SECURITY.md)
app/
  docs/          - Documentation site (Vocs)
  story/         - Component playground (Vite)
```

## Development Workflow

1. Create a branch from `main`
2. Make your changes
3. Run checks: `pnpm typecheck && pnpm lint && pnpm build`
4. Open a pull request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types**: `feat`, `fix`, `refactor`, `style`, `a11y`, `docs`, `chore`, `perf`

**Scopes**: `core`, `react`, `themes`, `docs`, `story`, `ci`

**Examples**:
```
feat(react): add TokenGate component
fix(core): handle undefined chain in getExplorerUrl
docs(react): add TransactionButton usage examples
```

## Code Style

- No semicolons
- Arrow functions everywhere
- `type` over `interface`
- CSS custom properties with `--txkit-*` prefix
- WCAG 2.1 AA accessibility compliance required
- See the codebase for detailed patterns

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what and why
- Ensure CI passes (typecheck, lint, build)
- Add/update tests if applicable

## Reporting Issues

- Use the [bug report template](https://github.com/txkit/mono/issues/new?template=bug_report.yml) for bugs
- Use the [feature request template](https://github.com/txkit/mono/issues/new?template=feature_request.yml) for ideas

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
