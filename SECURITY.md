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

## Recognition

We appreciate responsible disclosure. Contributors who report valid security issues will be credited in the release notes (unless they prefer to remain anonymous).
