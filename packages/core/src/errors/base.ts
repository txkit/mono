const DOCS_BASE_URL = 'https://docs.txkit.dev'

/** Base error class for txKit. Includes optional docsPath for linking to documentation */
export class TxKitError extends Error {
  override name = 'TxKitError'
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
    this.shortMessage = shortMessage
    this.docsPath = args.docsPath
    this.details = args.details
  }
}
