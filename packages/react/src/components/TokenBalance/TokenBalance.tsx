'use client'
import React, { useRef, useMemo, useEffect, forwardRef } from 'react'
import { formatUnits } from 'viem'
import { cx, formatFiatAmount, formatTokenAmountSplit } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import useTokenPrice from '../../hooks/useTokenPrice'
import useTokenBalance from '../../hooks/useTokenBalance'
import { defaultLabels } from './labels'
import TokenBalanceDefault from './TokenBalanceDefault'
import type { TokenBalanceProps, TokenBalanceRenderData } from '../../types/balance'
import './TokenBalance.css'


const TokenBalance = forwardRef<HTMLSpanElement, TokenBalanceProps>(({
  className,
  children,
  'data-testid': testId,
  variant = 'inline',
  icon,
  name,
  token,
  address,
  fiatCurrency = 'USD',
  price: priceProp,
  chainId,
  refetchInterval,
  labels: labelOverrides,
  formatOptions,
  showFiat = true,
  showIcon = true,
  showSymbol = true,
  onError,
  onBalanceChange,
}, ref) => {
  const mergedLabels = useDeepMemo(
    () => ({ ...defaultLabels, ...labelOverrides }),
    [ labelOverrides ],
  )

  const {
    symbol,
    balance,
    refetch,
    decimals,
    error: balanceErr,
    isError: balanceError,
    isLoading: balanceLoading,
  } = useTokenBalance({ token, chainId, address, refetchInterval })

  const {
    price: fetchedPrice,
  } = useTokenPrice({
    token,
    chainId,
    fiatCurrency,
    enabled: showFiat && priceProp === undefined,
  })

  const price = priceProp ?? fetchedPrice

  // Formatted values
  const dustThreshold = formatOptions?.dustThreshold
  const locale = formatOptions?.locale

  const splitAmount = useMemo(() => {
    if (balance === undefined || decimals === undefined) {
      return undefined
    }
    return formatTokenAmountSplit(balance, decimals, { dustThreshold, locale })
  }, [ locale, balance, decimals, dustThreshold ])

  const formatted = splitAmount?.full
  const integerPart = splitAmount?.integer ?? '0'
  const fractionPart = splitAmount?.fraction ?? ''

  const isZero = balance === 0n

  const fiatValue = useMemo(() => {
    if (balance === undefined || decimals === undefined || price === undefined) {
      return undefined
    }
    return Number(formatUnits(balance, decimals)) * price
  }, [ price, balance, decimals ])

  const fiatFormatted = useMemo(() => {
    if (fiatValue === undefined) {
      return undefined
    }
    return formatFiatAmount(fiatValue, fiatCurrency, locale)
  }, [ locale, fiatValue, fiatCurrency ])

  // Stable refs for event callbacks (avoid re-running effects on identity change)
  const onBalanceChangeRef = useRef(onBalanceChange)
  const onErrorRef = useRef(onError)

  onBalanceChangeRef.current = onBalanceChange
  onErrorRef.current = onError

  // Balance change callback (skip initial load)
  const prevBalanceRef = useRef<bigint | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  // Reset refs when token or address changes
  useEffect(() => {
    prevBalanceRef.current = undefined
    hasLoadedRef.current = false
  }, [ token, address ])

  useEffect(() => {
    if (balance === undefined) {
      return
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      prevBalanceRef.current = balance
      return
    }

    if (balance !== prevBalanceRef.current) {
      onBalanceChangeRef.current?.(balance, prevBalanceRef.current)
    }
    prevBalanceRef.current = balance
  }, [ balance ])

  // Error callback
  useEffect(() => {
    if (balanceErr) {
      onErrorRef.current?.(balanceErr)
    }
  }, [ balanceErr ])

  // No address - render nothing
  if (!address && !balanceLoading && balance === undefined) {
    return null
  }

  const isReady = !balanceLoading && !balanceError

  let state: 'loading' | 'error' | 'ready' = 'ready'
  if (balanceLoading) {
    state = 'loading'
  } else if (balanceError) {
    state = 'error'
  }

  let amountText = formatted ?? '0'
  if (balanceLoading) {
    amountText = mergedLabels.loading
  } else if (balanceError) {
    amountText = mergedLabels.error
  }

  const symbolPart = symbol ? ` ${symbol}` : ''
  const fiatPart = fiatFormatted ? `, ${fiatFormatted}` : ''

  let statusText = `${formatted ?? '0'}${symbolPart}${fiatPart}`
  if (balanceLoading) {
    statusText = mergedLabels.loading
  } else if (balanceError) {
    statusText = mergedLabels.error
  }

  const renderData: TokenBalanceRenderData = {
    icon,
    balance,
    decimals,
    symbol,
    formatted,
    integerPart: isReady ? integerPart : undefined,
    fractionPart: isReady ? fractionPart : undefined,
    isZero,
    fiatValue,
    fiatFormatted,
    isLoading: balanceLoading,
    isError: balanceError,
    error: balanceErr,
    refetch,
  }

  const rootClassName = cx(
    'txkit-tb',
    { 'txkit-tb-row': variant === 'row' },
    className
  )

  return (
    <span
      ref={ref}
      className={rootClassName}
      data-state={state}
      data-zero={isZero || undefined}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy={balanceLoading}
    >
      {
        typeof children === 'function'
          ? children(renderData)
          : (
            <TokenBalanceDefault
              icon={icon}
              name={name}
              symbol={symbol}
              variant={variant}
              amountText={amountText}
              statusText={statusText}
              retryLabel={mergedLabels.retry}
              integerPart={integerPart}
              fractionPart={fractionPart}
              fiatFormatted={fiatFormatted}
              isReady={isReady}
              isError={balanceError}
              isZero={isZero}
              showFiat={showFiat}
              showIcon={showIcon}
              showSymbol={showSymbol}
              onRetry={refetch}
            />
          )
      }
    </span>
  )
})

TokenBalance.displayName = 'TokenBalance'


export default TokenBalance
