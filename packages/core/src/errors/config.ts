import { TxKitError } from './base'


/** Thrown when TxKitProvider receives an invalid configuration */
export class InvalidConfigError extends TxKitError {
  override name = 'InvalidConfigError'
  constructor(details?: string) {
    super('Invalid TxKitProvider configuration.', {
      docsPath: '/errors/invalid-config',
      details,
    })
  }
}

/** Thrown when a txKit hook is used outside of TxKitProvider */
export class ProviderNotFoundError extends TxKitError {
  override name = 'ProviderNotFoundError'
  constructor() {
    super('TxKitProvider not found.', {
      docsPath: '/errors/provider-not-found',
      details: 'Wrap your app with <TxKitProvider> before using txKit hooks or components.',
    })
  }
}

/** Thrown in embedded mode when WagmiProvider is not found in the component tree */
export class MissingWagmiProviderError extends TxKitError {
  override name = 'MissingWagmiProviderError'
  constructor() {
    super('WagmiProvider not found in embedded mode.', {
      docsPath: '/errors/missing-wagmi-provider',
      details: 'When using <TxKitProvider embedded>, wrap it inside your existing <WagmiProvider> and <QueryClientProvider>.',
    })
  }
}

/** Thrown when a standalone TxKitProvider is nested inside another TxKitProvider */
export class NestedProviderError extends TxKitError {
  override name = 'NestedProviderError'
  constructor() {
    super('Nested <TxKitProvider> detected.', {
      docsPath: '/errors/nested-provider',
      details: 'Each standalone TxKitProvider creates its own wagmi store and QueryClient. Nesting them spawns duplicate stores, causes "Maximum update depth exceeded" from wagmi\'s useSyncExternalStore, and breaks wallet state. Use CSS classes (.txkit-dark / .txkit-light / .txkit-sharp) to show multiple theme variants inside one provider.',
    })
  }
}
