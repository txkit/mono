import { useMemo } from 'react'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import type { Chain, Transport } from 'viem'

import '../types/global'
import { DEFAULT_POLLING_INTERVAL } from '../components/TxKitProvider/utils/providerConstants'
import {
  TESTNET_CHAINS,
  TESTNET_TRANSPORTS,
  TESTNET_DISPLAY_CHAINS,
} from '../components/TxKitProvider/utils/testnetDefaults'


const defaultWallets = (projectId: string | null): TxKit.WalletConfig[] => [
  {
    id: 'injected',
    name: 'Browser Wallet',
    createConnector: injected(),
  },
  ...(projectId
    ? [{
      id: 'walletConnect',
      name: 'WalletConnect',
      icon: '/icons/walletconnect.svg',
      createConnector: walletConnect({ projectId, showQrModal: false }),
    }]
    : []),
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/icons/coinbase.svg',
    createConnector: coinbaseWallet({ appName: 'txkit' }),
  },
]

const useConfig = (config: TxKit.Config): TxKit.ResolvedConfig => {
  const pollingInterval = config.pollingInterval ?? DEFAULT_POLLING_INTERVAL
  const isTestnet = config.testnet === true

  // Testnet mode: user may override chains/transports, otherwise use Sepolia defaults.
  const chains = (config.chains ?? TESTNET_CHAINS) as [ Chain, ...Chain[] ]
  const transports = (config.transports ?? TESTNET_TRANSPORTS) as Record<number, Transport>

  // Display chains: testnet hides mainnet from UI (mainnet is in wagmi for ENS
  // only - must not appear in chain selectors or trigger wrong-chain state).
  const displayChains = isTestnet && !config.chains
    ? TESTNET_DISPLAY_CHAINS
    : chains

  return useMemo<TxKit.ResolvedConfig>(() => ({
    testnet: isTestnet,
    embedded: false,
    chains,
    displayChains,
    transports,
    walletConnectProjectId: config.walletConnectProjectId ?? null,
    wallets: config.wallets ?? defaultWallets(config.walletConnectProjectId ?? null),
    autoConnect: config.autoConnect ?? true,
    pollingInterval,
    blockWatching: {
      enabled: config.blockWatching?.enabled ?? true,
      throttleMs: config.blockWatching?.throttleMs ?? pollingInterval,
    },
    licenseKey: config.licenseKey ?? null,
  }), [
      isTestnet,
      chains,
      displayChains,
      transports,
      config.walletConnectProjectId,
      config.wallets,
      config.autoConnect,
      config.blockWatching?.enabled,
      config.blockWatching?.throttleMs,
      config.licenseKey,
      pollingInterval,
    ])
}


export default useConfig
