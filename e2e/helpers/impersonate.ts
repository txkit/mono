import type { JsonRpcProvider } from 'ethers'


type Input = {
  rpc: JsonRpcProvider
  rpcUrl: string
  address: string
}

// Cache impersonations per (rpcUrl, address) tuple. Anvil keeps the
// account impersonated until reset, so calling anvil_impersonateAccount
// twice for the same target is wasteful.
const cache: Record<string, Record<string, true>> = {}


export const impersonate = async ({ rpc, rpcUrl, address }: Input): Promise<void> => {
  const addressKey = address.toLowerCase()

  if (!cache[rpcUrl]) {
    cache[rpcUrl] = {}
  }

  if (cache[rpcUrl][addressKey]) {
    return
  }

  await rpc.send('anvil_impersonateAccount', [ address ])

  cache[rpcUrl][addressKey] = true
}
