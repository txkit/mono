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

const RowContent: React.FC<TokenBalanceDefaultProps> = (props) => {
  const {
    icon,
    name,
    symbol,
    onRetry,
    isError,
    isReady,
    showFiat,
    showIcon,
    amountText,
    statusText,
    retryLabel,
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

      <span className="tx-tb-info">
        <span className="tx-tb-name">{name ?? symbol ?? ''}</span>
        <span className="tx-tb-symbol">{symbol ?? ''}</span>
      </span>

      <span className="tx-tb-values">
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


export default RowContent
