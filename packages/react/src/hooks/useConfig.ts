import { useMemo } from 'react'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

import '../types/global'
import { DEFAULT_POLLING_INTERVAL } from '../helpers/providerConstants'

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

  return useMemo<TxKit.ResolvedConfig>(() => ({
    embedded: false,
    chains: config.chains,
    transports: config.transports,
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
      config.chains,
      config.transports,
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
