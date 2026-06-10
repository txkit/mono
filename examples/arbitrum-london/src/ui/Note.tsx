import type { ReactNode } from 'react'

import { Icon, type IconName } from './Icon'


type NoteProps = {
  icon: IconName,
  children: ReactNode,
}

/**
 * A small contextual callout: an accent-tinted icon bubble plus muted body text.
 * Used for the flow intro and the testnet disclaimer so they read as notes
 * rather than dashed drag-and-drop zones.
 */
export const Note = (props: NoteProps) => {
  const { icon, children } = props

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15">
        <Icon name={icon} className="size-4 text-accent" />
      </span>
      <div className="text-xs leading-relaxed text-muted">
        {children}
      </div>
    </div>
  )
}
