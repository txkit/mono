import React from 'react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import CodeBlock from './CodeBlock'


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
    <div className="story-section" id={sectionId}>
      <div className="story-section-header">
        <h3
          className="story-section-title"
          data-linkable=""
          onClick={handleTitleClick}
          title="Click to copy permalink"
        >
          {title}
          <span className="story-section-anchor">#</span>
        </h3>
        {
          code && (
            <button
              type="button"
              className="story-code-toggle"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </button>
          )
        }
      </div>
      {
        description && (
          <p className="story-description">{description}</p>
        )
      }
      <div className={`story-card${headless ? ' story-card--headless' : ''}`}>
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
