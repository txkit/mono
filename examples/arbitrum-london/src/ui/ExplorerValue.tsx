import { Icon } from './Icon'


type ExplorerValueProps = {
  value: string,
  display: string,
  explorerUrl?: string,
}

/**
 * A monospace address / hash. When an explorer URL is available the whole value
 * links out to the block explorer with the txKit external-link affordance;
 * otherwise it is plain read-only text. Opening the explorer is the only intent
 * here - there is no copy action.
 */
export const ExplorerValue = (props: ExplorerValueProps) => {
  const { value, display, explorerUrl } = props

  if (explorerUrl === undefined) {
    return (
      <span className="flex min-w-0 items-center justify-end">
        <span className="truncate font-mono">{display}</span>
      </span>
    )
  }

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${value} on the block explorer`}
      className="flex min-w-0 items-center justify-end gap-1.5 rounded font-mono text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="truncate">{display}</span>
      <Icon name="external-link" className="size-3.5 shrink-0" />
    </a>
  )
}
