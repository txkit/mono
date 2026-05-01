import React from 'react'


type StorySectionTitleProps = {
  text: string
}

/** Preserve camelCase hook / function names inside uppercase-transformed section titles. */
const StorySectionTitle: React.FC<StorySectionTitleProps> = ({ text }) => {
  const parts = text.split(/(\buse[A-Z][A-Za-z]+)/)
  return (
    <>
      {
        parts.map((part, index) => (
          /^use[A-Z]/.test(part)
            ? <code key={`code-${index}`} className="story-section-title-code">{part}</code>
            : <React.Fragment key={`txt-${index}`}>{part}</React.Fragment>
        ))
      }
    </>
  )
}


export default StorySectionTitle
