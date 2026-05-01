'use client'
import React, { useEffect, useRef, useState } from 'react'
import type { DecodedCalldata, RiskResult } from '@txkit/core'

import maskStyle from '../../../helpers/maskStyle'
import copyIcon from '../../../assets/icons/copy.svg'
import checkIcon from '../../../assets/icons/check.svg'
import alertTriangleIcon from '../../../assets/icons/alert-triangle.svg'

import './DecodedCalldataPreview.css'


type DecodedCalldataPreviewProps = {
  decoded: DecodedCalldata
  warnings?: string[]
  riskLevel?: RiskResult['level']
}

const MAX_UINT256 = (1n << 256n) - 1n

const formatValue = (value: unknown, type: string): string => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (Array.isArray(value)) {
    const inner = type.replace(/\[\d*\]$/, '')
    return `[${value.map((element) => formatValue(element, inner)).join(', ')}]`
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value, (_key, jsonValue) => typeof jsonValue === 'bigint' ? jsonValue.toString() : jsonValue)
  }
  return String(value)
}

const buildSignature = (decoded: DecodedCalldata): string => {
  const types = decoded.args.map((arg) => arg.type).join(',')
  return `${decoded.functionName}(${types})`
}

const isAddressArg = (value: unknown, type: string): boolean =>
  type === 'address' && typeof value === 'string' && value.startsWith('0x')

const isMaxApproval = (value: unknown): boolean =>
  typeof value === 'bigint' && value === MAX_UINT256

const errorLevels: readonly RiskResult['level'][] = [ 'high', 'critical' ]

const DecodedCalldataPreview: React.FC<DecodedCalldataPreviewProps> = (props) => {
  const {
    decoded,
    warnings,
    riskLevel,
  } = props

  const [ copiedIndex, setCopiedIndex ] = useState<number | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(copiedTimerRef.current), [])

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard?.writeText(text)
    setCopiedIndex(index)
    clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopiedIndex(null), 2000)
  }

  const signature = buildSignature(decoded)
  const warningType = riskLevel && errorLevels.includes(riskLevel) ? 'error' : 'warning'
  const showWarnings = warnings && warnings.length > 0

  return (
    <div className="tx-dcp">
      <div className="tx-dcp-header">
        <div className="tx-dcp-function">{decoded.functionName}</div>
        <div className="tx-dcp-signature">{signature}</div>
      </div>

      <div className="tx-dcp-args">
        {
          decoded.args.map((arg, index) => {
            const rawValue = formatValue(arg.value, arg.type)
            const warn = isMaxApproval(arg.value)
            const displayValue = warn ? 'Unlimited' : rawValue
            const showCopy = isAddressArg(arg.value, arg.type)
            const argName = arg.name || `arg${index}`
            const isCopied = copiedIndex === index
            const copyMaskStyle = maskStyle(isCopied ? checkIcon : copyIcon)

            return (
              <div key={`${argName}-${index}`} className="tx-dcp-arg">
                <div className="tx-dcp-arg-name">{argName}</div>
                <div className="tx-dcp-arg-row">
                  <div className="tx-dcp-arg-value" data-warning={warn ? 'true' : undefined}>{displayValue}</div>
                  {
                    showCopy && (
                      <button
                        type="button"
                        className="tx-dcp-copy"
                        data-copied={isCopied ? 'true' : undefined}
                        onClick={() => handleCopy(rawValue, index)}
                        aria-label={isCopied ? 'Copied' : 'Copy address'}
                      >
                        <span
                          className="tx-dcp-copy-icon"
                          aria-hidden="true"
                          style={copyMaskStyle}
                        />
                        <span className="tx-dcp-sr" role="status" aria-live="polite">
                          {isCopied ? 'Address copied to clipboard' : ''}
                        </span>
                      </button>
                    )
                  }
                </div>
              </div>
            )
          })
        }
      </div>

      {
        showWarnings && (
          <div className="tx-dcp-warnings">
            {
              warnings.map((warning, index) => (
                <div key={index} className="tx-dcp-warning" data-type={warningType} role="alert">
                  <span
                    className="tx-dcp-warning-icon"
                    aria-hidden="true"
                    style={maskStyle(alertTriangleIcon)}
                  />
                  <span className="tx-dcp-warning-text">{warning}</span>
                </div>
              ))
            }
          </div>
        )
      }
    </div>
  )
}


export default DecodedCalldataPreview
