'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { CopyableValue } from './CopyableValue'
import { PolicyStatusBadge, type PolicyStatus } from './PolicyStatusBadge'


type DecodedArg = {
  name: string,
  type: string,
  value: unknown,
}

type DecodedCallShape = {
  selector?: string,
  functionName?: string,
  args?: ReadonlyArray<DecodedArg>,
  source?: string,
  clearSigning?: { title?: string, fields?: Record<string, string> },
}

type EnvelopePreviewProps = {
  chainLabel: string,
  toAddress: `0x${string}`,
  innerToAddress: `0x${string}`,
  innerLabel: string,
  envelopeHash: `0x${string}`,
  validityNotAfter: number,
  decoded?: DecodedCallShape,
  policyStatus?: PolicyStatus,
  policyReason?: string,
  explorerBaseUrl?: string,
  feeSlot?: ReactNode,
}

const formatExpiry = (remainingSeconds: number): string => {
  if (remainingSeconds <= 0) {
    return 'expired'
  }

  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60

  return `${hours}h ${minutes}m ${seconds}s`
}

const formatAddress = (address: string): string => {
  if (address.length <= 12) {
    return address
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

const stringifyValue = (value: unknown): string => {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (typeof value === 'string') {
    return value
  }

  if (value === null || value === undefined) {
    return ''
  }

  return JSON.stringify(value)
}

const buildExplorerUrl = (baseUrl: string | undefined, address: string): string | undefined => {
  if (baseUrl === undefined) {
    return undefined
  }

  return `${baseUrl}/address/${address}`
}

export const EnvelopePreview = (props: EnvelopePreviewProps) => {
  const {
    chainLabel,
    toAddress,
    innerToAddress,
    innerLabel,
    envelopeHash,
    validityNotAfter,
    decoded,
    policyStatus,
    policyReason,
    explorerBaseUrl,
    feeSlot,
  } = props

  const [ remainingSeconds, setRemainingSeconds ] = useState(() =>
    Math.max(0, validityNotAfter - Math.floor(Date.now() / 1000)),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, validityNotAfter - Math.floor(Date.now() / 1000)))
    }, 1000)

    return () => clearInterval(interval)
  }, [ validityNotAfter ])

  const title = decoded?.clearSigning?.title ?? decoded?.functionName ?? 'Unknown action'
  const fields = decoded?.clearSigning?.fields ?? {}
  const argList = decoded?.args ?? []

  const badgeNode = policyStatus !== undefined
    ? <PolicyStatusBadge status={policyStatus} reason={policyReason} />
    : null

  const argsNode = argList.length > 0
    ? (
      <details className="text-sm">
        <summary className="cursor-pointer text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
          Decoded arguments ({argList.length})
        </summary>
        <dl className="mt-3 grid gap-2">
          {argList.map((arg) => (
            <div key={arg.name} className="grid grid-cols-[140px_1fr] gap-2 font-mono text-xs">
              <dt className="text-[color:var(--color-muted)]">{fields[arg.name] ?? arg.name}</dt>
              <dd className="break-all">{stringifyValue(arg.value)}</dd>
            </div>
          ))}
        </dl>
      </details>
    )
    : null

  const feeNode = feeSlot !== undefined && feeSlot !== null
    ? <div className="px-5 py-4 border-t border-[color:var(--color-border)]">{feeSlot}</div>
    : null

  const argsContainerNode = argsNode !== null
    ? <div className="px-5 pb-5 pt-4">{argsNode}</div>
    : null

  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <p className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-mono">Prepared envelope</p>
        {badgeNode}
      </div>

      <div className="px-5 pb-5 pt-2 border-b border-[color:var(--color-border)]">
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-sm text-[color:var(--color-muted)]">{innerLabel}</p>
      </div>

      <div className="grid gap-3 text-sm px-5 py-4">
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)] shrink-0">Chain</span>
          <span className="font-mono">{chainLabel}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)] shrink-0">Policy gate</span>
          <CopyableValue value={toAddress} display={formatAddress(toAddress)} explorerUrl={buildExplorerUrl(explorerBaseUrl, toAddress)} />
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)] shrink-0">Inner target</span>
          <CopyableValue value={innerToAddress} display={formatAddress(innerToAddress)} explorerUrl={buildExplorerUrl(explorerBaseUrl, innerToAddress)} />
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)] shrink-0">Envelope hash</span>
          <CopyableValue value={envelopeHash} display={formatAddress(envelopeHash)} />
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)] shrink-0">Expires in</span>
          <span className="font-mono">{formatExpiry(remainingSeconds)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)] shrink-0">Decoder source</span>
          <span className="font-mono">{decoded?.source ?? 'unknown'}</span>
        </div>
      </div>

      {feeNode}

      {argsContainerNode}
    </div>
  )
}
