'use client'
import React from 'react'

import TokenIcon from './TokenIcon'
import type { TokenBalanceDefaultProps } from '../../types/balance'


const RowContent: React.FC<TokenBalanceDefaultProps> = ({
  icon,
  name,
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

    <span className="txkit-tb-info">
      <span className="txkit-tb-name">{name ?? symbol ?? ''}</span>
      <span className="txkit-tb-symbol">{symbol ?? ''}</span>
    </span>

    <span className="txkit-tb-values">
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
    </span>

    <span className="txkit-tb-status">{statusText}</span>
  </>
)


export default RowContent
