import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import encodeQR from '@paulmillr/qr'
import { copyToClipboard } from '@txkit/core'

import type { ConnectWalletLabels } from './labels'


type WalletQRCodeProps = {
  uri: string | undefined
  isLoading: boolean
  walletIcon?: string
  isTimedOut: boolean
  labels: Required<ConnectWalletLabels>
  onRetry: () => void
}

const COPIED_FEEDBACK_MS = 2000

const WalletQRCode: React.FC<WalletQRCodeProps> = ({
  uri,
  isLoading,
  walletIcon,
  isTimedOut,
  labels,
  onRetry,
}) => {
  const [ copied, setCopied ] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Cleanup copied feedback timer on unmount
  useEffect(() => {
    return () => clearTimeout(copiedTimerRef.current)
  }, [])

  // Generate SVG QR code from URI
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

  // Loading state - waiting for WC SDK to generate pairing URI
  if (isLoading && !uri) {
    return (
      <div className="txkit-cw-qr" role="status" aria-busy="true" aria-live="polite">
        {
          walletIcon && (
            <img src={walletIcon} alt="" className="txkit-cw-qr-wallet-icon" />
          )
        }
        <div className="txkit-cw-qr-code txkit-cw-qr-skeleton" aria-hidden="true" />
        <span className="txkit-cw-qr-label">{labels.scanWithPhone}</span>
      </div>
    )
  }

  return (
    <div className="txkit-cw-qr">
      {
        walletIcon && (
          <img src={walletIcon} alt="" className="txkit-cw-qr-wallet-icon" />
        )
      }

      {
        qrDataUri && (
          <div className="txkit-cw-qr-code">
            <img
              src={qrDataUri}
              alt="WalletConnect QR code"
              className="txkit-cw-qr-img"
              draggable={false}
            />
          </div>
        )
      }

      <span className="txkit-cw-qr-label">{labels.scanWithPhone}</span>

      <div className="txkit-cw-qr-actions">
        <button
          type="button"
          className="txkit-cw-qr-copy"
          onClick={handleCopy}
          disabled={!uri}
          aria-live="polite"
        >
          {copied ? labels.copied : labels.copyLink}
        </button>
      </div>

      {
        isTimedOut && (
          <div className="txkit-cw-timeout">
            <span className="txkit-cw-timeout-text">{labels.takingTooLong}</span>
            <button type="button" className="txkit-cw-timeout-btn" onClick={onRetry}>
              {labels.retry}
            </button>
          </div>
        )
      }
    </div>
  )
}


export default WalletQRCode
