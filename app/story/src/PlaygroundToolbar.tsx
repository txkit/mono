import React from 'react'

import { cx } from '@txkit/core'

import { usePlayground } from './PlaygroundContext'


const themes: TxKit.Theme[] = [ 'light', 'dark', 'auto' ]
const variants: TxKit.Variant[] = [ 'default', 'soft', 'sharp', 'rounded' ]

const PlaygroundToolbar: React.FC = () => {
  const {
    theme,
    variant,
    setTheme,
    setVariant,
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
    </div>
  )
}


export default PlaygroundToolbar
