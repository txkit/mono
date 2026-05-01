import React from 'react'

import { RotateCcwIcon } from '../../components/Icons/icons'
import hashColor from '../../helpers/hashColor'


type MockState = 'loading' | 'ready' | 'error'

type Props = {
  state?: MockState
  variant?: 'inline' | 'row'
  icon?: string
  name?: string
  symbol?: string
  amount?: string
  fiat?: string
  showFiat?: boolean
  showIcon?: boolean
  showSymbol?: boolean
  onRetry?: () => void
}

const DASH = '\u2014'

const TbMockBalance: React.FC<Props> = ({
  state = 'ready',
  variant = 'inline',
  icon,
  name = 'Ether',
  symbol = 'ETH',
  amount = '1.2345',
  fiat = '$4,321.98',
  showFiat = true,
  showIcon = true,
  showSymbol = true,
  onRetry,
}) => {
  const isRow = variant === 'row'
  const rootClass = `tx-tb${isRow ? ' tx-tb-row' : ''}`

  const renderIcon = () => {
    if (!showIcon) {
      return null
    }
    return (
      <span className="tx-tb-icon-wrap">
        {
          icon
            ? <img src={icon} alt="" className="tx-tb-icon" />
            : (
              <span
                className="tx-tb-icon-fallback"
                style={{ backgroundColor: hashColor(symbol || 'token') }}
              >
                {(symbol || 'T').charAt(0).toUpperCase()}
              </span>
            )
        }
      </span>
    )
  }

  const renderRetry = () => {
    if (!onRetry) {
      return null
    }
    return (
      <button
        type="button"
        className="tx-tb-retry"
        onClick={onRetry}
        aria-label="Retry"
      >
        <RotateCcwIcon size={12} />
      </button>
    )
  }

  if (state === 'loading') {
    return (
      <span className={rootClass} data-state="loading" data-show-fiat={showFiat || undefined}>
        {
          showIcon && (
            <span className="tx-tb-icon-wrap">
              <span className="tx-tb-icon-fallback">&nbsp;</span>
            </span>
          )
        }
        {
          isRow && (
            <span className="tx-tb-info">
              <span className="tx-tb-name">&nbsp;</span>
            </span>
          )
        }
        {
          isRow
            ? (
              <span className="tx-tb-values">
                <span className="tx-tb-amount">&nbsp;</span>
                {showFiat && <span className="tx-tb-fiat">&nbsp;</span>}
              </span>
            )
            : (
              <span className="tx-tb-text">
                <span className="tx-tb-line">
                  <span className="tx-tb-amount">&nbsp;</span>
                </span>
                {showFiat && <span className="tx-tb-fiat">&nbsp;</span>}
              </span>
            )
        }
      </span>
    )
  }

  if (state === 'error') {
    if (isRow) {
      return (
        <span className={rootClass} data-state="error" data-show-fiat={showFiat || undefined}>
          {renderIcon()}
          <span className="tx-tb-info">
            <span className="tx-tb-name">{name}</span>
            {showSymbol && <span className="tx-tb-symbol">{symbol}</span>}
          </span>
          <span className="tx-tb-values">
            <span className="tx-tb-amount">{DASH}</span>
            {showFiat && <span className="tx-tb-fiat">{DASH}</span>}
          </span>
          {renderRetry()}
        </span>
      )
    }
    return (
      <span className={rootClass} data-state="error" data-show-fiat={showFiat || undefined}>
        {renderIcon()}
        <span className="tx-tb-text">
          <span className="tx-tb-line">
            <span className="tx-tb-amount">{DASH}</span>
            {showSymbol && <span className="tx-tb-symbol">{symbol}</span>}
          </span>
          {showFiat && <span className="tx-tb-fiat">{DASH}</span>}
        </span>
        {renderRetry()}
      </span>
    )
  }

  if (isRow) {
    return (
      <span className={rootClass} data-state="ready" data-show-fiat={showFiat || undefined}>
        {renderIcon()}
        <span className="tx-tb-info">
          <span className="tx-tb-name">{name}</span>
          {showSymbol && <span className="tx-tb-symbol">{symbol}</span>}
        </span>
        <span className="tx-tb-values">
          <span className="tx-tb-amount">{amount}</span>
          {showFiat && <span className="tx-tb-fiat">{fiat}</span>}
        </span>
      </span>
    )
  }

  return (
    <span className={rootClass} data-state="ready" data-show-fiat={showFiat || undefined}>
      {renderIcon()}
      <span className="tx-tb-text">
        <span className="tx-tb-line">
          <span className="tx-tb-amount">{amount}</span>
          {showSymbol && <span className="tx-tb-symbol">{symbol}</span>}
        </span>
        {showFiat && <span className="tx-tb-fiat">{fiat}</span>}
      </span>
    </span>
  )
}


export default TbMockBalance
