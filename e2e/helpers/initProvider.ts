import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Wallet, JsonRpcProvider, getBytes, isHexString, parseEther, toBeHex } from 'ethers'
import type { Page } from '@playwright/test'

import { impersonate } from './impersonate'
import { chains, defaultChainIdHex, type SupportedChain } from './chains'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const providerScriptPath = path.join(__dirname, 'eip1193-provider.js')
const providerScriptTemplate = fs.readFileSync(providerScriptPath, 'utf-8')

// Test wallets get 10000 ETH on Anvil to remove balance noise from tests.
const initialEthHex = toBeHex(parseEther('10000'))

type InitProviderInput = {
  page: Page
  chain?: SupportedChain
  address?: string
  privateKey?: string
}

const buildProviderScript = (address: string, chainIdHex: string): string => (
  // Placeholders appear in both the JSDoc comment block AND the actual code;
  // String.replace with a string arg only swaps the first occurrence (in the
  // comment), leaving the real declarations unreplaced. Use a global regex.
  providerScriptTemplate
    .replace(/__MOCK_CHAINS_JSON__/g, () => JSON.stringify(chains))
    .replace(/__MOCK_DEFAULT_CHAIN_ID_HEX__/g, () => chainIdHex)
    .replace(/__MOCK_ADDRESS__/g, () => address)
)

const exposeSigner = async (page: Page, privateKey: string): Promise<void> => {
  const wallet = new Wallet(privateKey)

  const exposals: Array<[ string, (...args: any[]) => Promise<string> ]> = [
    [
      '__txkit_e2e_signTypedData',
      async (_address: string, data: string) => {
        const { domain, types, message } = JSON.parse(data)
        const { EIP712Domain: _, ...cleanTypes } = types

        return wallet.signTypedData(domain, cleanTypes, message)
      },
    ],
    [
      '__txkit_e2e_personalSign',
      async (_address: string, message: string) => {
        const payload = isHexString(message) ? getBytes(message) : message

        return wallet.signMessage(payload)
      },
    ],
  ]

  for (const [ name, fn ] of exposals) {
    try {
      await page.exposeFunction(name, fn)
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      // exposeFunction throws if the name is already registered (subsequent
      // navigations in the same context). That's fine - the function is
      // still callable. Bubble up unexpected errors.
      if (!/already registered/i.test(errorMessage)) {
        throw error
      }
    }
  }
}

const impersonateOnChain = async (rpcUrl: string, address: string): Promise<void> => {
  const rpc = new JsonRpcProvider(rpcUrl)

  try {
    await impersonate({ rpc, rpcUrl, address })
    await rpc.send('anvil_setBalance', [ address, initialEthHex ])
  }
  finally {
    rpc.destroy()
  }
}


export const initProvider = async (input: InitProviderInput): Promise<{ address: string }> => {
  const { page, chain = 'sepolia' } = input

  const chainIdHex = chain === 'sepolia' ? '0xaa36a7' : '0x1'

  if (!chains[chainIdHex]) {
    throw new Error(`Unknown chain: ${chain}`)
  }

  let address = input.address

  if (!address) {
    if (!input.privateKey) {
      throw new Error('initProvider: either address or privateKey must be provided')
    }

    address = new Wallet(input.privateKey).address
  }

  const script = buildProviderScript(address, chainIdHex)

  // Only impersonate on chains backed by a local Anvil fork. Mainnet entry
  // points at a public RPC (read-only) for ENS lookups.
  const isLocalRpc = (url: string): boolean => (
    url.includes('127.0.0.1') || url.includes('localhost')
  )

  const impersonationTasks = Object.values(chains)
    .filter((entry) => isLocalRpc(entry.rpcUrl))
    .map((entry) => impersonateOnChain(entry.rpcUrl, address!))

  const tasks: Array<Promise<unknown>> = [ ...impersonationTasks ]

  if (input.privateKey) {
    tasks.push(exposeSigner(page, input.privateKey))
  }

  await Promise.all(tasks)

  await page.addInitScript(script)

  return { address }
}
