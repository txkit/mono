import { useContext, useMemo, useRef } from 'react'
import { WagmiContext } from 'wagmi'
import { MissingWagmiProviderError } from '@txkit/core'

import '../types/global'
import { DEFAULT_POLLING_INTERVAL } from '../helpers/providerConstants'


const MAINNET_CHAIN_ID = 1

const useEmbeddedWagmi = (config?: TxKit.EmbeddedConfig): TxKit.ResolvedConfig => {
  const wagmiConfig = useContext(WagmiContext)
  const warned = useRef(false)

  if (!wagmiConfig) {
    throw new MissingWagmiProviderError()
  }

  if (!warned.current) {
    const chainIds = wagmiConfig.chains.map((chain) => chain.id)

    if (chainIds.length === 0) {
      console.warn(
        '[txKit] No chains configured in external wagmi config. txKit components may not work correctly.',
      )
    }
    else if (!chainIds.includes(MAINNET_CHAIN_ID)) {
      console.warn(
        '[txKit] Mainnet (chainId: 1) not found in wagmi config. ENS name and avatar resolution will not work.',
      )
    }

    warned.current = true
  }

  const pollingInterval = config?.pollingInterval ?? DEFAULT_POLLING_INTERVAL

  return useMemo<TxKit.ResolvedConfig>(
    () => ({
      embedded: true,
      chains: wagmiConfig.chains as [typeof wagmiConfig.chains[0], ...typeof wagmiConfig.chains],
      transports: {},
      walletConnectProjectId: null,
      wallets: [],
      autoConnect: true,
      pollingInterval,
      blockWatching: {
        enabled: config?.blockWatching?.enabled ?? true,
        throttleMs: config?.blockWatching?.throttleMs ?? pollingInterval,
      },
      licenseKey: config?.licenseKey ?? null,
    }),
    [ wagmiConfig.chains, config?.blockWatching?.enabled, config?.blockWatching?.throttleMs, config?.licenseKey, pollingInterval ],
  )
}


export default useEmbeddedWagmi
