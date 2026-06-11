import type { CSSProperties } from 'react'


export type IconName =
  | 'brain'
  | 'shield'
  | 'check-circle'
  | 'x-circle'
  | 'info'
  | 'chevron-right'
  | 'arrow-up'
  | 'github'
  | 'git-pull-request'
  | 'message-square'
  | 'external-link'

type IconProps = {
  name: IconName,
  className?: string,
}

const ICON_SOURCES: Record<IconName, string> = {
  'brain': "url('/icons/brain.svg')",
  'shield': "url('/icons/shield.svg')",
  'check-circle': "url('/icons/check-circle.svg')",
  'x-circle': "url('/icons/x-circle.svg')",
  'info': "url('/icons/info.svg')",
  'chevron-right': "url('/icons/chevron-right.svg')",
  'arrow-up': "url('/icons/arrow-up.svg')",
  'github': "url('/icons/github.svg')",
  'git-pull-request': "url('/icons/git-pull-request.svg')",
  'message-square': "url('/icons/message-square.svg')",
  'external-link': "url('/icons/external-link.svg')",
}

/**
 * A monochrome icon rendered via CSS mask over the current text color, so it
 * tints with any `text-*` utility (txKit rule: no inline SVG in JSX). The
 * source files live in public/icons; the shared mask plumbing is the
 * `.tx-icon-mask` class in globals.css. Decorative by default (aria-hidden) -
 * the surrounding control carries the accessible label.
 */
export const Icon = (props: IconProps) => {
  const { name, className } = props
  const maskStyle: CSSProperties = {
    maskImage: ICON_SOURCES[name],
    WebkitMaskImage: ICON_SOURCES[name],
  }

  return (
    <span
      aria-hidden="true"
      className={`tx-icon-mask bg-current ${className ?? ''}`}
      style={maskStyle}
    />
  )
}
