'use client'
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import encodeQR from '@paulmillr/qr'
import { copyToClipboard } from '@txkit/core'

import type { ConnectWalletLabels } from '../labels'


type WalletQRCodeProps = {
  uri: string | undefined
  isLoading: boolean
  walletIcon?: string
  isTimedOut: boolean
  labels: Required<ConnectWalletLabels>
  onRetry: () => void
}

const COPIED_FEEDBACK_MS = 2000

const WalletQRCode: React.FC<WalletQRCodeProps> = (props) => {
  const {
    uri,
    labels,
    onRetry,
    walletIcon,
    isTimedOut,
    isLoading,
  } = props

  const [ copied, setCopied ] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    return () => clearTimeout(copiedTimerRef.current)
  }, [])

  const qrDataUri = useMemo(() => {
    if (!uri) {
      return undefined
    }

    try {
      const svg = encodeQR(uri, 'svg', { border: 2, scale: 8 })
      return 'data:image/svg+xml,' + encodeURIComponent(svg)
    }
    catch {
      return undefined
    }
  }, [ uri ])

  const handleCopy = useCallback(async () => {
    if (!uri) {
      return
    }

    const success = await copyToClipboard(uri)

    if (success) {
      setCopied(true)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    }
  }, [ uri ])

  if (isLoading && !uri) {
    return (
      <div className="tx-cw-qr" role="status" aria-busy="true" aria-live="polite">
        {
          walletIcon && (
            <img src={walletIcon} alt="" className="tx-cw-qr-wallet-icon" />
          )
        }
        <div className="tx-cw-qr-code tx-cw-qr-skeleton" aria-hidden="true" />
        <span className="tx-cw-qr-label">{labels.scanWithPhone}</span>
      </div>
    )
  }

  return (
    <div className="tx-cw-qr">
      {
        walletIcon && (
          <img src={walletIcon} alt="" className="tx-cw-qr-wallet-icon" />
        )
      }

      {
        qrDataUri && (
          <div className="tx-cw-qr-code">
            <img
              src={qrDataUri}
              alt="WalletConnect QR code"
              className="tx-cw-qr-img"
              draggable={false}
            />
          </div>
        )
      }

      <span className="tx-cw-qr-label">{labels.scanWithPhone}</span>

      <div className="tx-cw-qr-actions">
        <button
          type="button"
          className="tx-cw-qr-copy"
          onClick={handleCopy}
          disabled={!uri}
          aria-live="polite"
        >
          {copied ? labels.copied : labels.copyLink}
        </button>
      </div>

      {
        isTimedOut && (
          <div className="tx-cw-timeout">
            <span className="tx-cw-timeout-text">{labels.takingTooLong}</span>
            <button type="button" className="tx-cw-timeout-btn" onClick={onRetry}>
              {labels.retry}
            </button>
          </div>
        )
      }
    </div>
  )
}


export default WalletQRCode
