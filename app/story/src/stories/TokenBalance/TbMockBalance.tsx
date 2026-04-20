import React from 'react'


type MockState = 'loading' | 'ready' | 'zero' | 'error'

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
}

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
}) => {
  if (state === 'loading') {
    return (
      <span className={`txkit-tb${variant === 'row' ? ' txkit-tb-row' : ''}`} data-state="loading">
        {
          showIcon && (
            <span className="txkit-tb-icon-wrap">
              <span className="txkit-tb-icon-fallback">&nbsp;</span>
            </span>
          )
        }
        {
          variant === 'row' && (
            <span className="txkit-tb-info">
              <span className="txkit-tb-name">&nbsp;</span>
            </span>
          )
        }
        <span className={variant === 'row' ? 'txkit-tb-values' : undefined}>
          <span className="txkit-tb-amount">&nbsp;</span>
          {showFiat && <span className="txkit-tb-fiat">&nbsp;</span>}
        </span>
      </span>
    )
  }

  if (state === 'error') {
    return (
      <span className={`txkit-tb${variant === 'row' ? ' txkit-tb-row' : ''}`} data-state="error">
        <span className="txkit-tb-amount" style={{ color: 'var(--txkit-color-error, #ef4444)' }}>
          Failed to load
        </span>
      </span>
    )
  }

  const displayAmount = state === 'zero' ? '0.0000' : amount
  const displayFiat = state === 'zero' ? '$0.00' : fiat
  const dimStyle = state === 'zero' ? { opacity: 0.5 } : undefined

  if (variant === 'row') {
    return (
      <span className="txkit-tb txkit-tb-row" data-state="ready" style={dimStyle}>
        {
          showIcon && (
            <span className="txkit-tb-icon-wrap">
              {
                icon
                  ? <img src={icon} alt="" className="txkit-tb-icon" />
                  : <span className="txkit-tb-icon-fallback">{symbol.charAt(0)}</span>
              }
            </span>
          )
        }
        <span className="txkit-tb-info">
          <span className="txkit-tb-name">{name}</span>
          {showSymbol && <span className="txkit-tb-symbol">{symbol}</span>}
        </span>
        <span className="txkit-tb-values">
          <span className="txkit-tb-amount">{displayAmount}</span>
          {showFiat && <span className="txkit-tb-fiat">{displayFiat}</span>}
        </span>
      </span>
    )
  }

  return (
    <span className="txkit-tb" data-state="ready" style={dimStyle}>
      {
        showIcon && icon && (
          <span className="txkit-tb-icon-wrap">
            <img src={icon} alt="" className="txkit-tb-icon" />
          </span>
        )
      }
      <span className="txkit-tb-amount">
        {displayAmount}{showSymbol && ` ${symbol}`}
      </span>
      {showFiat && <span className="txkit-tb-fiat">{displayFiat}</span>}
    </span>
  )
}


export default TbMockBalance
