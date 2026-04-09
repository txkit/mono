import React, { type ReactNode } from 'react'
import { cx } from '@txkit/core'

import '../../types/global'
import FlowProvider from './FlowProvider'
import BalanceWatcher from './BalanceWatcher'
import TxKitErrorBoundary from './TxKitErrorBoundary'
import { TxKitContext } from './TxKitProvider'


type TxKitInnerProps = {
  children: ReactNode
  contextValue: TxKit.Context
  variant?: TxKit.Variant
}

const TxKitInner: React.FC<TxKitInnerProps> = ({ children, contextValue, variant }) => (
  <TxKitContext.Provider value={contextValue}>
    <FlowProvider>
      <BalanceWatcher>
        <div
          className={cx('txkit-root', `txkit-${contextValue.theme}`, {
            [`txkit-${variant}`]: variant !== 'default' && variant !== undefined,
          })}
        >
          <TxKitErrorBoundary>
            {children}
          </TxKitErrorBoundary>
        </div>
      </BalanceWatcher>
    </FlowProvider>
  </TxKitContext.Provider>
)


export default TxKitInner
