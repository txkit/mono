import React from 'react'
import type { ReactNode } from 'react'

import CodeBlock from '../CodeBlock/CodeBlock'
import StorySectionTitle from './StorySectionTitle'
import wrapJsx from '../../helpers/wrapJsx'


type StorySectionProps = {
  id?: string
  title: string
  children: ReactNode
  useWhen?: string
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
  useWhen,
  description,
  code,
  headless,
}) => {
  const sectionId = id ?? slugify(title)

  const handleTitleClick = () => {
    const current = window.location.hash.slice(1).split('/')[0]
    const newHash = current ? `${current}/${sectionId}` : sectionId
    window.location.hash = newHash
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
            <StorySectionTitle text={title} />
            <span className="story-section-anchor">#</span>
          </h3>
          {
            useWhen && (
              <p className="story-section-use-when">
                <em>Use when:</em> {useWhen}
              </p>
            )
          }
          {
            description && (
              <p className="story-section-desc">{description}</p>
            )
          }
        </div>
      </div>
      <div className="story-section-stage">
        {children}
      </div>
      {
        code && (
          <CodeBlock code={wrapJsx(code)} />
        )
      }
    </div>
  )
}


export default StorySection
