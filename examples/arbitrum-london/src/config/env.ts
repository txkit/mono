import { z } from 'zod'


/**
 * Environment loader with zod validation. Server-only secrets stay
 * unprefixed so Next refuses to leak them to the client bundle.
 *
 * Public values (chain RPC URLs that can ship in client bundles) get the
 * NEXT_PUBLIC_ prefix - none currently because we route all chain reads
 * through the server.
 */
const envSchema = z.object({
  // LLM for /api/agent - one of ANTHROPIC_API_KEY or GROQ_API_KEY is required.
  // Anthropic Claude Agent SDK (preferred when set).
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Groq - free, OpenAI-compatible fallback used when no Anthropic key is set.
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).default('llama-3.3-70b-versatile'),

  // Arbitrum Sepolia
  ARB_SEPOLIA_RPC_URL: z
    .string()
    .url()
    .default('https://sepolia-rollup.arbitrum.io/rpc'),
  ARBISCAN_API_KEY: z.string().min(1).optional(),

  // Robinhood Chain testnet (chainId 46630)
  ROBINHOOD_TESTNET_RPC_URL: z
    .string()
    .url()
    .default('https://rpc.testnet.chain.robinhood.com'),

  // Deployer + signer
  DEPLOYER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  AGENT_SIGNER_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  // Server-side EIP-712 signing key for /api/agent envelope binding.
  // Pair must match AGENT_SIGNER_ADDRESS - the on-chain AgentPolicyGate
  // recovers ECDSA signatures and reverts InvalidSignature if mismatched.
  // TESTNET ONLY KEY - rotate before any mainnet usage.
  AGENT_SIGNER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Coerce blank env vars ("") to undefined so optional fields stay optional and
 * defaulted fields fall back to their default. A blank value (common when
 * copying .env.example and clearing it, or a host that injects empty vars)
 * otherwise fails z.string().min(1)/.url() and surfaces a raw 500 instead of
 * the route's intended "not set" handling.
 */
const blankToUndefined = (source: NodeJS.ProcessEnv): Record<string, string | undefined> => {
  const entries = Object.entries(source).map(([ key, value ]) => [ key, value === '' ? undefined : value ] as const)

  return Object.fromEntries(entries)
}

/**
 * Lazy-load + cache the parsed env. Called from server-only modules.
 * Throwing during module init breaks Next dev hot reload, so we defer to
 * first access and surface a 500 + structured error from the API route.
 */
let cachedEnv: Env | undefined
export const getEnv = (): Env => {
  if (cachedEnv === undefined) {
    cachedEnv = envSchema.parse(blankToUndefined(process.env))
  }
  return cachedEnv
}
