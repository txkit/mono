'use client'
import React from 'react'

import RetryIcon from '../RetryIcon'
import TokenIcon from '../TokenIcon'
import type { TokenBalanceDefaultProps } from '../../../types/balance'


type FiatInput = {
  isReady: boolean
  isError: boolean
  fiatFormatted: string | undefined
}

const getFiatContent = (input: FiatInput): string => {
  if (input.isReady && input.fiatFormatted) {
    return input.fiatFormatted
  }
  if (input.isError) {
    return '-'
  }
  return '\u00a0'
}

const InlineContent: React.FC<TokenBalanceDefaultProps> = (props) => {
  const {
    icon,
    symbol,
    onRetry,
    isError,
    isReady,
    showFiat,
    showIcon,
    amountText,
    statusText,
    retryLabel,
    showSymbol,
    integerPart,
    fractionPart,
    fiatFormatted,
  } = props

  const fiatContent = getFiatContent({ isReady, isError, fiatFormatted })

  return (
    <>
      {
        showIcon && (
          <span className="tx-tb-icon-wrap">
            <TokenIcon icon={icon} symbol={symbol} />
          </span>
        )
      }

      <span className="tx-tb-text">
        <span className="tx-tb-line">
          {
            isReady
              ? (
                <span className="tx-tb-amount">
                  <span className="tx-tb-integer">{integerPart}</span>
                  {
                    fractionPart && (
                      <span className="tx-tb-fraction">{fractionPart}</span>
                    )
                  }
                </span>
              )
              : <span className="tx-tb-amount">{amountText}</span>
          }

          {
            (isReady || isError) && showSymbol && symbol && (
              <span className="tx-tb-symbol">{symbol}</span>
            )
          }
        </span>

        {
          showFiat && (
            <span className="tx-tb-fiat">{fiatContent}</span>
          )
        }
      </span>

      {
        isError && onRetry && (
          <button
            className="tx-tb-retry"
            type="button"
            onClick={onRetry}
            aria-label={retryLabel}
          >
            <RetryIcon size={14} />
          </button>
        )
      }

      <span className="tx-tb-status">{statusText}</span>
    </>
  )
}


export default InlineContent
