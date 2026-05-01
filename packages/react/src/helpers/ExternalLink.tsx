import React from 'react'


type ExternalLinkProps = {
  href: string
  className?: string
  'aria-label'?: string
  children: React.ReactNode
}

const ExternalLink: React.FC<ExternalLinkProps> = (props) => {
  const {
    href,
    className,
    children,
    'aria-label': ariaLabel,
  } = props

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  )
}


export default ExternalLink
