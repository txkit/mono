const DOCS_BASE_URL = 'https://docs.txkit.dev'

/**
 * Stable identifier for txKit errors. `code` is preferred over `instanceof`
 * (cross-bundle hazard with duplicated copies) and `name === 'X'` (typo-prone
 * string match) for runtime checks in consumer code. Each subclass overrides
 * the static `code` and stamps the same value on every instance.
 */
export type TxKitErrorCode =
  | 'TXKIT_GENERIC'
  | 'TXKIT_INVALID_CONFIG'
  | 'TXKIT_PROVIDER_NOT_FOUND'
  | 'TXKIT_MISSING_WAGMI_PROVIDER'
  | 'TXKIT_NESTED_PROVIDER'

/** Base error class for txKit. Includes optional docsPath for linking to documentation */
export class TxKitError extends Error {
  override name = 'TxKitError'
  static code: TxKitErrorCode = 'TXKIT_GENERIC'
  code: TxKitErrorCode
  shortMessage: string
  docsPath?: string
  details?: string

  constructor(shortMessage: string, args: {
    docsPath?: string
    details?: string
    cause?: Error
  } = {}) {
    const docsUrl = args.docsPath ? `${DOCS_BASE_URL}${args.docsPath}` : undefined
    const message = [
      shortMessage,
      docsUrl && `Docs: ${docsUrl}`,
      args.details && `Details: ${args.details}`,
    ].filter(Boolean).join('\n')

    super(message, args.cause ? { cause: args.cause } : undefined)
    this.code = (this.constructor as typeof TxKitError).code
    this.shortMessage = shortMessage
    this.docsPath = args.docsPath
    this.details = args.details
  }
}

/**
 * Type guard for TxKitError that does not depend on `instanceof`. Consumers
 * SHOULD match on `error.code` (a stable string) rather than constructor or
 * `name` identity, both of which break across bundle boundaries when more
 * than one copy of `@txkit/core` ends up in the tree.
 */
export const isTxKitError = (value: unknown): value is TxKitError => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!('code' in value)) {
    return false
  }
  const candidate = (value as { code: unknown }).code
  return typeof candidate === 'string' && candidate.startsWith('TXKIT_')
}
