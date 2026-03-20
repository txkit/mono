import type { ReactNode, RefObject } from 'react'
import type { Chain } from 'viem'
import type { Connector } from 'wagmi'

import type { WalletState } from './useWalletState'
import type { ConnectWalletLabels } from './labels'


/** Data passed to children render function for custom UI */
export type ConnectWalletRenderData = {
  /** Current connection state */
  state: WalletState
  /** Connected wallet address */
  address: `0x${string}` | undefined
  /** Formatted display address (shortened or ENS) */
  displayAddress: string | undefined
  /** ENS name */
  ensName: string | null | undefined
  /** ENS avatar URL */
  ensAvatar: string | null | undefined
  /** Formatted native balance with symbol */
  formattedBalance: string | undefined
  /** Current chain */
  chain: Chain | undefined
  /** Available wallet connectors */
  connectors: readonly Connector[]
  /** Connect a specific wallet */
  connect: (connector: Connector) => void
  /** Disconnect and close panel */
  disconnect: () => void
  /** Switch to a different chain */
  switchChain: (chainId: number) => void
  /** Open wallet selection modal */
  openModal: () => void
  /** Close any open panel */
  closePanel: () => void
  /** Connection error */
  error: Error | null
  /** True while connection is pending */
  isPending: boolean
}

export type ConnectWalletDefaultProps = {
  buttonRef: RefObject<HTMLButtonElement | null>
  state: WalletState
  panel: 'closed' | 'modal' | 'dropdown'
  address: `0x${string}` | undefined
  ensName: string | null | undefined
  ensAvatar: string | null | undefined
  buttonLabel: string | null
  statusMessage: string
  formattedBalance: string | undefined
  resolvedDisplayAddress: string | undefined
  chain: Chain | undefined
  connectors: readonly Connector[]
  mergedLabels: Required<ConnectWalletLabels>
  showAvatar: boolean
  showBalance: boolean
  onModalClose: () => void
  onDisconnect: () => void
  onPanelClose: () => void
  onButtonClick: () => void
  onModalSelect: (connector: Connector) => void
}

export type ConnectWalletProps = {
  className?: string
  children?: (data: ConnectWalletRenderData) => ReactNode
  /** Test ID for automated testing */
  'data-testid'?: string
  /** Button text in disconnected state */
  label?: string
  /** Force a specific chain - shows 'Wrong Network' if user is on another */
  chainId?: number
  /** Override default UI text strings */
  labels?: Partial<ConnectWalletLabels>
  /** Show ENS name when available */
  showEns?: boolean
  /** Show ENS avatar or generated avatar */
  showAvatar?: boolean
  /** Show native token balance when connected */
  showBalance?: boolean
  /** Called when connection fails */
  onError?: (error: Error) => void
  /** Called after successful wallet connection */
  onConnect?: (data: { address: string; connector: string }) => void
  /** Called after wallet disconnection */
  onDisconnect?: () => void
  /** Custom address display formatter */
  formatAddress?: (address: string, ensName?: string) => string
}
