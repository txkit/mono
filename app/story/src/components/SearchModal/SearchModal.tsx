import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'


type SearchResult = {
  story: string
  section: string
  description?: string
}

type SearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (story: string) => void
  items: SearchResult[]
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, onSelect, items }) => {
  const [ query, setQuery ] = useState('')
  const [ activeIndex, setActiveIndex ] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? items.filter((item) => {
      const q = query.toLowerCase()
      return item.story.toLowerCase().includes(q)
          || item.section.toLowerCase().includes(q)
          || (item.description?.toLowerCase().includes(q) ?? false)
    })
    : items

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [ open ])

  useEffect(() => {
    setActiveIndex(0)
  }, [ query ])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      onSelect(filtered[activeIndex].story)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [ filtered, activeIndex, onSelect, onClose ])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [ open, onClose ])

  if (!open) {
    return null
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <span className="search-icon">&#128269;</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search stories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="search-kbd">esc</kbd>
        </div>
        <div className="search-results">
          {
            filtered.length === 0
              ? <div className="search-empty">No results</div>
              : (() => {
                const grouped = new Map<string, typeof filtered>()
                for (const item of filtered.slice(0, 20)) {
                  const group = grouped.get(item.story) ?? []
                  group.push(item)
                  grouped.set(item.story, group)
                }
                let globalIndex = 0
                return Array.from(grouped.entries()).map(([ storyName, items ]) => (
                  <div key={storyName} className="search-group">
                    <div className="search-group-header">{storyName}</div>
                    {
                      items.map((item) => {
                        const index = globalIndex++
                        return (
                          <button
                            key={`${item.story}-${item.section}`}
                            type="button"
                            className={`search-result ${index === activeIndex ? 'active' : ''}`}
                            onClick={() => { onSelect(item.story); onClose() }}
                            onMouseEnter={() => setActiveIndex(index)}
                          >
                            <span className="search-result-section">{item.section}</span>
                            {
                              item.description && (
                                <span className="search-result-desc">{item.description}</span>
                              )
                            }
                            {
                              index === activeIndex && (
                                <span className="search-result-enter">&#x21B5;</span>
                              )
                            }
                          </button>
                        )
                      })
                    }
                  </div>
                ))
              })()
          }
        </div>
        <div className="search-footer">
          <div className="search-footer-hint">
            <kbd>&uarr;</kbd>
            <kbd>&darr;</kbd>
            <span>navigate</span>
          </div>
          <div className="search-footer-hint">
            <kbd>&crarr;</kbd>
            <span>select</span>
          </div>
        </div>
      </div>
    </div>
  )
}


export default SearchModal
