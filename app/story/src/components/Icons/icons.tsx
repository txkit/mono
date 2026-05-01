import React from 'react'

import './icons.css'


type IconProps = {
  className?: string
  size?: number
  onClick?: React.MouseEventHandler<HTMLSpanElement>
}

/**
 * Icons are served as static .svg files from /public/icons/ via CSS mask-image -
 * they stay out of the JS bundle, get browser-cached, and inherit `currentColor`.
 * This component is a thin <span> wrapper that sets size and the CSS class.
 */
const Icon: React.FC<IconProps & { name: string; defaultSize: number }> = ({
  name,
  className,
  defaultSize,
  size,
  onClick,
}) => {
  const pixels = size ?? defaultSize

  return (
    <span
      className={className ? `pg-icon pg-icon-${name} ${className}` : `pg-icon pg-icon-${name}`}
      style={{ width: pixels, height: pixels }}
      onClick={onClick}
      aria-hidden="true"
    />
  )
}

export const CopyIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="copy" defaultSize={14} />
)

export const CheckIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="check" defaultSize={14} />
)

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="chevron-down" defaultSize={14} />
)

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="chevron-right" defaultSize={14} />
)

export const RotateCcwIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="rotate-ccw" defaultSize={12} />
)

export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="external-link" defaultSize={12} />
)

export const InfoIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="info" defaultSize={16} />
)

export const AlertTriangleIcon: React.FC<IconProps> = (props) => (
  <Icon {...props} name="alert-triangle" defaultSize={16} />
)
