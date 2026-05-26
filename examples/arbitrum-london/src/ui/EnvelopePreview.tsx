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

export const EnvelopePreview = ({
  chainLabel,
  toAddress,
  innerToAddress,
  innerLabel,
  envelopeHash,
  validityNotAfter,
  decoded,
  policyStatus,
  policyReason,
}: EnvelopePreviewProps) => {
  const title = decoded?.clearSigning?.title ?? decoded?.functionName ?? 'Unknown action'
  const fields = decoded?.clearSigning?.fields ?? {}
  const argList = decoded?.args ?? []

  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Prepared envelope</p>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {policyStatus !== undefined ? (
          <PolicyStatusBadge status={policyStatus} reason={policyReason} />
        ) : null}
      </div>

      <p className="text-sm opacity-80">{innerLabel}</p>

      <div className="grid gap-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="opacity-60">Chain</span>
          <span className="font-mono">{chainLabel}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="opacity-60">Policy gate</span>
          <span className="font-mono truncate max-w-[60%]" title={toAddress}>{toAddress}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="opacity-60">Inner target</span>
          <span className="font-mono truncate max-w-[60%]" title={innerToAddress}>{innerToAddress}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="opacity-60">Envelope hash</span>
          <span className="font-mono truncate max-w-[60%]" title={envelopeHash}>{envelopeHash}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="opacity-60">Expires in</span>
          <span className="font-mono">{formatExpiry(validityNotAfter)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="opacity-60">Decoder source</span>
          <span className="font-mono">{decoded?.source ?? 'unknown'}</span>
        </div>
      </div>

      {argList.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer opacity-80 hover:opacity-100">
            Decoded arguments ({argList.length})
          </summary>
          <dl className="mt-3 grid gap-2">
            {argList.map((arg) => (
              <div key={arg.name} className="grid grid-cols-[140px_1fr] gap-2 font-mono text-xs">
                <dt className="opacity-60">{fields[arg.name] ?? arg.name}</dt>
                <dd className="break-all">{stringifyValue(arg.value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  )
}
