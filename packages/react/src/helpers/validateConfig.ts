import { InvalidConfigError } from '@txkit/core'

import '../types/global'


const validateConfig = (config: TxKit.Config) => {
  if (!config || typeof config !== 'object') {
    throw new InvalidConfigError('Config must be an object.')
  }

  // testnet: true fills chains + transports from defaults - skip validation.
  // User may still pass partial chains/transports; if so, validate those below.
  if (config.testnet === true && !config.chains && !config.transports) {
    return
  }

  if (!config.chains || config.chains.length === 0) {
    throw new InvalidConfigError(
      'At least one chain is required. Example: chains: [mainnet]',
    )
  }

  if (!config.transports || typeof config.transports !== 'object') {
    throw new InvalidConfigError(
      'Transports must be provided for each chain.',
    )
  }

  for (const chain of config.chains) {
    if (!config.transports[chain.id]) {
      throw new InvalidConfigError(
        `Missing transport for chain "${chain.name}" (id: ${chain.id}).`,
      )
    }
  }
}


export default validateConfig
