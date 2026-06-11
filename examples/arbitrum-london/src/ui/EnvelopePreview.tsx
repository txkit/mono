'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { Collapse } from './Collapse'
import { ExplorerValue } from './ExplorerValue'
import { Icon } from './Icon'
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
  innerData?: `0x${string}`,
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
    innerData,
    policyStatus,
    policyReason,
    explorerBaseUrl,
    feeSlot,
  } = props

  const [ remainingSeconds, setRemainingSeconds ] = useState(() =>
    Math.max(0, validityNotAfter - Math.floor(Date.now() / 1000)),
  )
  const [ isRawShown, setRawShown ] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, validityNotAfter - Math.floor(Date.now() / 1000)))
    }, 1000)

    return () => clearInterval(interval)
  }, [ validityNotAfter ])

  const title = decoded?.clearSigning?.title ?? decoded?.functionName ?? 'Unknown action'
  const fields = decoded?.clearSigning?.fields ?? {}
  const argList = decoded?.args ?? []
  const functionName = decoded?.functionName

  const badgeNode = policyStatus !== undefined
    ? <PolicyStatusBadge status={policyStatus} reason={policyReason} />
    : null

  const callBlockNode = functionName !== undefined
    ? (
      <div className="px-5 pt-4">
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">Decoded function call</p>
        <div className="space-y-1 rounded-lg bg-card-sunken p-4 font-mono text-xs">
          <div>
            <span className="font-semibold text-accent">{functionName}</span>
            <span className="text-muted">(</span>
          </div>
          <div className="space-y-1 pl-4">
            {argList.map((arg, index) => (
              <div key={arg.name} className="break-all">
                <span className="text-muted">{fields[arg.name] ?? arg.name}:</span>{' '}
                <span className="text-foreground">{stringifyValue(arg.value)}</span>
                {index < argList.length - 1 ? <span className="text-muted">,</span> : null}
              </div>
            ))}
          </div>
          <div className="text-muted">)</div>
        </div>
      </div>
    )
    : null

  // Collapse animates the reveal and the hide (grid-rows 0fr <-> 1fr),
  // matching the envelope-review collapsible. Rendered only inside rawHexNode,
  // so innerData is always defined here.
  const rawRevealNode = (
    <Collapse isOpen={isRawShown}>
      <div className="mt-2 rounded-lg bg-card-sunken p-3 font-mono text-xs break-all">
        <p className="mb-1 text-warning">Without txKit, this opaque hex is all the agent asks you to sign:</p>
        <span className="text-muted">{innerData}</span>
      </div>
    </Collapse>
  )

  // Inline toggle (not a block <summary>): the hover/click target is just the
  // chevron + label, so hovering past the text no longer highlights a full-width
  // row. The chevron rotates 90deg to point down when the calldata is open.
  const rawHexNode = innerData !== undefined ? (
    <div className="px-5 pt-2 pb-1">
      <button
        type="button"
        onClick={() => setRawShown((shown) => !shown)}
        aria-expanded={isRawShown}
        className="inline-flex items-center gap-1.5 rounded text-xs text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Icon
          name="chevron-right"
          className={`size-3.5 transition-transform motion-reduce:transition-none ${isRawShown ? 'rotate-90' : ''}`}
        />
        {isRawShown ? 'Hide raw calldata' : 'Show raw calldata'}
      </button>
      {rawRevealNode}
    </div>
  ) : null

  const feeNode = feeSlot !== undefined && feeSlot !== null
    ? <div className="px-5 py-4 border-t border-border">{feeSlot}</div>
    : null

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-col gap-2 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <p className="text-xs uppercase tracking-wider text-muted font-mono">Prepared envelope</p>
        {badgeNode}
      </div>

      <div className="px-5 pb-5 pt-2 border-b border-border">
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted">{innerLabel}</p>
      </div>

      {callBlockNode}
      {rawHexNode}

      <div className="grid gap-3 text-sm px-5 py-4">
        <div className="flex justify-between gap-3">
          <span className="text-muted shrink-0">Chain</span>
          <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
            {chainLabel}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted shrink-0">Policy gate</span>
          <ExplorerValue value={toAddress} display={formatAddress(toAddress)} explorerUrl={buildExplorerUrl(explorerBaseUrl, toAddress)} />
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted shrink-0">Inner target</span>
          <ExplorerValue value={innerToAddress} display={formatAddress(innerToAddress)} explorerUrl={buildExplorerUrl(explorerBaseUrl, innerToAddress)} />
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted shrink-0">Envelope hash</span>
          <ExplorerValue value={envelopeHash} display={formatAddress(envelopeHash)} />
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted shrink-0">Expires in</span>
          <span className="font-mono">
            {formatExpiry(remainingSeconds)}{' '}
            <span
              className="text-xs text-muted opacity-70"
              title="Producer-declared validity window. On this testnet demo gate it is advisory; in production the policy gate enforces the deadline on-chain as a hard limit."
            >
              (advisory on testnet)
            </span>
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted shrink-0">Decoder source</span>
          <span className="font-mono">{decoded?.source ?? 'unknown'}</span>
        </div>
      </div>

      {feeNode}
    </div>
  )
}
