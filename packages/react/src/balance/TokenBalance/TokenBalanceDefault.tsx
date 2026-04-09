'use client'
import React, { useState } from 'react'

import hashColor from '../../utils/hashColor'
import type { TokenBalanceDefaultProps } from '../types'

const TokenIcon: React.FC<{
  icon: string | undefined
  symbol: string | undefined
}> = ({ icon, symbol }) => {
  const [ imgError, setImgError ] = useState(false)

  if (icon && !imgError) {
    return (
      <img
        className="txkit-tb-icon"
        src={icon}
        alt=""
        onError={() => setImgError(true)}
      />
    )
  }

  const letter = (symbol ?? '?').charAt(0).toUpperCase()
  const bgColor = hashColor(symbol ?? 'default')

  return (
    <span
      className="txkit-tb-icon-fallback"
      style={{ backgroundColor: bgColor }}
      aria-hidden="true"
    >
      {letter}
    </span>
  )
}

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
      isReady && showFiat && fiatFormatted && (
        <span className="txkit-tb-fiat">{fiatFormatted}</span>
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
        isReady && showFiat && fiatFormatted && (
          <span className="txkit-tb-fiat">{fiatFormatted}</span>
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

const TokenBalanceDefault: React.FC<TokenBalanceDefaultProps> = (props) => {
  return props.variant === 'row'
    ? <RowContent {...props} />
    : <InlineContent {...props} />
}


export default TokenBalanceDefault
