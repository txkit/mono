'use client'
import React from 'react'

import TokenIcon from './TokenIcon'
import type { TokenBalanceDefaultProps } from '../../types/balance'


const InlineContent: React.FC<TokenBalanceDefaultProps> = ({
  icon,
  symbol,
  amountText,
  statusText,
  retryLabel,
  integerPart,
  fractionPart,
  fiatFormatted,
  isReady,
  isError,
  showFiat,
  showIcon,
  showSymbol,
  onRetry,
}) => (
  <>
    {
      showIcon && (
        <span className="txkit-tb-icon-wrap">
          <TokenIcon icon={icon} symbol={symbol} />
        </span>
      )
    }

    {
      isReady
        ? (
          <span className="txkit-tb-amount">
            <span className="txkit-tb-integer">{integerPart}</span>
            {
              fractionPart && (
                <span className="txkit-tb-fraction">{fractionPart}</span>
              )
            }
          </span>
        )
        : <span className="txkit-tb-amount">{amountText}</span>
    }

    {
      isReady && showSymbol && symbol && (
        <span className="txkit-tb-symbol">{symbol}</span>
      )
    }

    {
      showFiat && !isError && ((isReady && fiatFormatted) || !isReady) && (
        <span className="txkit-tb-fiat">{isReady ? fiatFormatted : '\u00a0'}</span>
      )
    }

    {
      isError && (
        <button
          className="txkit-tb-retry"
          type="button"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      )
    }

    <span className="txkit-tb-status">{statusText}</span>
  </>
)


export default InlineContent
