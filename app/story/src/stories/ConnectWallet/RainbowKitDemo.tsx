import { useCallback } from 'react'
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { ConnectWallet } from '@txkit/react'


type RainbowKitDemoProps = {
  connectLabel: string
  size: 'default' | 'compact'
  variant: 'default' | 'outline' | 'ghost' | 'soft'
  avatarStyle: 'gradient' | 'pixel'
  chainId?: number
  showBalance: boolean
  showFiat: boolean
  showAvatar: boolean
  showEns: boolean
}

const RainbowKitBridge = ({
  connectLabel,
  size,
  variant,
  avatarStyle,
  chainId,
  showBalance,
  showFiat,
  showAvatar,
  showEns,
}: RainbowKitDemoProps) => {
  const { openConnectModal } = useConnectModal()

  const handleRequestConnect = useCallback(() => {
    if (!openConnectModal) {
      return false
    }
    openConnectModal()
    return true
  }, [ openConnectModal ])

  return (
    <ConnectWallet
      label={connectLabel}
      size={size}
      variant={variant}
      avatarStyle={avatarStyle}
      chainId={chainId}
      showBalance={showBalance}
      showFiat={showFiat}
      showAvatar={showAvatar}
      showEns={showEns}
      onRequestConnect={handleRequestConnect}
    />
  )
}

const RainbowKitDemo = (props: RainbowKitDemoProps) => (
  <RainbowKitProvider modalSize="compact" locale="en">
    <RainbowKitBridge {...props} />
  </RainbowKitProvider>
)


export default RainbowKitDemo
