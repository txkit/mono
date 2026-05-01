'use client'
import React, { useMemo, type ReactNode } from 'react'

import '../../../types/global'
import TxKitInner from '../TxKitInner'
import useTheme from '../../../hooks/useTheme'
import useEmbeddedWagmi from '../../../hooks/useEmbeddedWagmi'


const EmbeddedProvider = ({ children, config }: { children: ReactNode; config?: TxKit.EmbeddedConfig }) => {
  const resolvedConfig = useEmbeddedWagmi(config)
  const { theme, setTheme } = useTheme({ initialTheme: config?.theme })

  const contextValue = useMemo<TxKit.Context>(
    () => ({ config: resolvedConfig, theme, setTheme, isProEnabled: false }),
    [ resolvedConfig, theme, setTheme ],
  )

  return (
    <TxKitInner contextValue={contextValue} variant={config?.variant}>
      {children}
    </TxKitInner>
  )
}


export default EmbeddedProvider
