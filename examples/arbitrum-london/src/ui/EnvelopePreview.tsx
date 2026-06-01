import type { ReactNode } from 'react'

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
  feeSlot?: ReactNode,
}

const formatExpiry = (notAfter: number): string => {
  const remainingSeconds = notAfter - Math.floor(Date.now() / 1000)
  if (remainingSeconds <= 0) {
    return 'expired'
  }

  const minutes = Math.floor(remainingSeconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)

  return `${hours}h ${minutes % 60}m`
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
    feeSlot,
  } = props

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
          <span className="text-[color:var(--color-muted)]">Chain</span>
          <span className="font-mono">{chainLabel}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)]">Policy gate</span>
          <span className="font-mono" title={toAddress}>{formatAddress(toAddress)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)]">Inner target</span>
          <span className="font-mono" title={innerToAddress}>{formatAddress(innerToAddress)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)]">Envelope hash</span>
          <span className="font-mono" title={envelopeHash}>{formatAddress(envelopeHash)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)]">Expires in</span>
          <span className="font-mono">{formatExpiry(validityNotAfter)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)]">Decoder source</span>
          <span className="font-mono">{decoded?.source ?? 'unknown'}</span>
        </div>
        {feeSlot}
      </div>

      {argsNode !== null ? (
        <div className="px-5 pb-5">
          {argsNode}
        </div>
      ) : null}
    </div>
  )
}
