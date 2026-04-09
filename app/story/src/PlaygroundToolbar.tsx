import React from 'react'

import { cx } from '@txkit/core'

import { usePlayground } from './PlaygroundContext'


const themes: TxKit.Theme[] = [ 'light', 'dark', 'auto' ]
const variants: TxKit.Variant[] = [ 'default', 'soft', 'sharp', 'rounded' ]

const colorSchemes = [
  { id: 'indigo' as const, color: '#4338CA', label: 'Indigo' },
  { id: 'violet' as const, color: '#7C3AED', label: 'Violet' },
]

const PlaygroundToolbar: React.FC = () => {
  const {
    theme,
    variant,
    colorScheme,
    setTheme,
    setVariant,
    setColorScheme,
  } = usePlayground()

  return (
    <div className="playground-toolbar">
      <div className="playground-toolbar-group">
        <span className="playground-toolbar-label">Theme</span>
        <div className="playground-toolbar-buttons">
          {
            themes.map((t) => (
              <button
                key={t}
                type="button"
                className={cx('playground-toolbar-btn', { active: theme === t })}
                onClick={() => setTheme(t)}
              >
                {t}
              </button>
            ))
          }
        </div>
      </div>

      <div className="playground-toolbar-group">
        <span className="playground-toolbar-label">Variant</span>
        <div className="playground-toolbar-buttons">
          {
            variants.map((v) => (
              <button
                key={v}
                type="button"
                className={cx('playground-toolbar-btn', { active: variant === v })}
                onClick={() => setVariant(v)}
              >
                {v}
              </button>
            ))
          }
        </div>
      </div>

      <div className="playground-toolbar-group">
        <span className="playground-toolbar-label">Color</span>
        <div className="playground-toolbar-buttons playground-color-buttons">
          {
            colorSchemes.map((cs) => (
              <button
                key={cs.id}
                type="button"
                className={cx('playground-color-btn', { active: colorScheme === cs.id })}
                onClick={() => setColorScheme(cs.id)}
                aria-label={cs.label}
                title={cs.label}
              >
                <span
                  className="playground-color-dot"
                  style={{ background: cs.color }}
                />
              </button>
            ))
          }
        </div>
      </div>
    </div>
  )
}


export default PlaygroundToolbar
