import React from 'react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import CodeBlock from '../CodeBlock/CodeBlock'
import { ChevronDownIcon } from '../Icons/icons'


type StorySectionProps = {
  id?: string
  title: string
  children: ReactNode
  description?: string
  code?: string
  headless?: boolean
}

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** Preserve camelCase hook / function names inside uppercase-transformed section titles. */
const renderTitle = (text: string): ReactNode[] => {
  const parts = text.split(/(\buse[A-Z][A-Za-z]+)/)
  return parts.map((part, index) => (
    /^use[A-Z]/.test(part)
      ? <code key={`code-${index}`} className="story-section-title-code">{part}</code>
      : <React.Fragment key={`txt-${index}`}>{part}</React.Fragment>
  ))
}

const StorySection: React.FC<StorySectionProps> = ({
  id,
  title,
  children,
  description,
  code,
  headless,
}) => {
  const [ showCode, setShowCode ] = useState(false)
  const sectionId = id ?? slugify(title)

  const handleTitleClick = () => {
    window.location.hash = sectionId
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className={`story-section ${headless ? 'story-section--headless' : ''}`} id={sectionId}>
      <div className="story-section-bar">
        <div className="story-section-meta">
          <h3
            className="story-section-title"
            data-linkable=""
            onClick={handleTitleClick}
            title="Click to copy permalink"
          >
            {renderTitle(title)}
            <span className="story-section-anchor">#</span>
          </h3>
          {
            description && (
              <p className="story-section-desc">{description}</p>
            )
          }
        </div>
        {
          code && (
            <button
              type="button"
              className="story-code-toggle"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? 'Hide Code' : 'Show Code'}
              <ChevronDownIcon
                size={14}
                className={`story-code-chevron ${showCode ? 'rotated' : ''}`}
              />
            </button>
          )
        }
      </div>
      <div className="story-section-stage">
        {children}
      </div>
      {
        showCode && code && (
          <CodeBlock code={code} />
        )
      }
    </div>
  )
}


export default StorySection
