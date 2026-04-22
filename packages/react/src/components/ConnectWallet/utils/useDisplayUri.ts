import { useState, useEffect } from 'react'
import type { Connector } from 'wagmi'


// Each wagmi connector has its own emitter (created by createConfig via
// createEmitter). The WalletConnect connector emits display_uri on its
// emitter: `config.emitter.emit('message', { type: 'display_uri', data: uri })`.
// The `config` there is the connector-local config, NOT the global wagmi config.
// So we must listen on `connector.emitter`, not `useConfig().emitter`.
type ConnectorEmitter = {
  on: (event: string, handler: (data: unknown) => void) => void
  off: (event: string, handler: (data: unknown) => void) => void
}

export type UseDisplayUriReturn = {
  /** WalletConnect pairing URI for QR code generation */
  displayUri: string | undefined
  /** True while waiting for the URI (between connect() and display_uri event) */
  isLoadingUri: boolean
}

/**
 * Captures WalletConnect display_uri from the connector's emitter.
 * The URI is emitted asynchronously after connect() is called on a WC connector.
 */
const useDisplayUri = (connector: Connector | undefined, isPending: boolean): UseDisplayUriReturn => {
  const [ displayUri, setDisplayUri ] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!isPending || !connector) {
      setDisplayUri(undefined)
      return
    }

    // Access connector.emitter (runtime property, not in wagmi's public Connector type).
    // Each connector gets its own emitter via createConfig -> createEmitter(uid()).
    if (!('emitter' in connector)) {
      return
    }
    const emitter = (connector as unknown as { emitter: ConnectorEmitter }).emitter

    const handleMessage = (data: unknown) => {
      if (typeof data !== 'object' || data === null) {
        return
      }
      if (!('type' in data) || !('data' in data)) {
        return
      }
      if (data.type === 'display_uri' && typeof data.data === 'string') {
        setDisplayUri(data.data)
      }
    }

    emitter.on('message', handleMessage)

    return () => {
      emitter.off('message', handleMessage)
    }
  }, [ connector, isPending ])

  return {
    displayUri,
    isLoadingUri: isPending && !displayUri,
  }
}


export default useDisplayUri
