/**
 * Chain registry for the E2E provider injection. The values match what
 * txKit's testnet preset registers in wagmi (Sepolia + mainnet for ENS).
 *
 * `rpcUrl` should point at your local Anvil fork. Mainnet entry has no
 * local fork — ENS resolution falls through to the public RPC, which is
 * fine because tests don't write to mainnet.
 */
export const ANVIL_RPC_URL = 'http://localhost:8545'

export type SupportedChain = 'sepolia' | 'mainnet'

type ChainEntry = {
  hexadecimalChainId: string
  decimalChainId: number
  name: string
  rpcUrl: string
}

export const chains: Record<string, ChainEntry> = {
  // Sepolia (txKit story default)
  '0xaa36a7': {
    hexadecimalChainId: '0xaa36a7',
    decimalChainId: 11155111,
    name: 'Sepolia',
    rpcUrl: ANVIL_RPC_URL,
  },
  // Mainnet (ENS lookups). Public read-only endpoint - no fork.
  '0x1': {
    hexadecimalChainId: '0x1',
    decimalChainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
  },
}

export const defaultChainIdHex = '0xaa36a7'

export const getChain = (id: SupportedChain): ChainEntry => {
  const hex = id === 'sepolia' ? '0xaa36a7' : '0x1'
  const chain = chains[hex]

  if (!chain) {
    throw new Error(`Unknown chain: ${id}`)
  }

  return chain
}
