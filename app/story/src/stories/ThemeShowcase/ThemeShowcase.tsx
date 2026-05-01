import React, { useState } from 'react'
import { cx } from '@txkit/core'

import CodeBlock from '../../components/CodeBlock/CodeBlock'
import { ChevronRightIcon } from '../../components/Icons/icons'

import './ThemeShowcase.css'


type ColorScheme = 'indigo' | 'violet' | 'blue' | 'pink'
type Variant = 'default' | 'soft' | 'sharp' | 'rounded'
type Theme = 'light' | 'dark'

type SchemeMeta = {
  id: ColorScheme
  label: string
  hue: number
}

type VariantMeta = {
  id: Variant
  label: string
}

const colorSchemes: readonly SchemeMeta[] = [
  { id: 'indigo', label: 'Indigo', hue: 276 },
  { id: 'violet', label: 'Violet', hue: 292 },
  { id: 'blue', label: 'Blue', hue: 256 },
  { id: 'pink', label: 'Pink', hue: 0 },
]

const variants: readonly VariantMeta[] = [
  { id: 'default', label: 'Default' },
  { id: 'soft', label: 'Soft' },
  { id: 'sharp', label: 'Sharp' },
  { id: 'rounded', label: 'Rounded' },
]

const themes: readonly Theme[] = [ 'light', 'dark' ]

const tokenList: readonly string[] = [
  '--tx-color-primary',
  '--tx-color-primary-hover',
  '--tx-color-primary-active',
  '--tx-color-primary-alpha',
  '--tx-color-ring',
]


type MiniCellProps = {
  scheme: ColorScheme
  variant: Variant
}

const MiniCell: React.FC<MiniCellProps> = ({ scheme, variant }) => {
  const variantClass = variant === 'default' ? null : `tx-${variant}`

  return (
    <div className={cx('tshow-cell', `tx-color-${scheme}`, variantClass)}>
      <button type="button" className="tshow-btn">Action</button>
      <div className="tshow-input">0x742d...4a9c</div>
      <div className="tshow-token">
        <span className="tshow-token-dot" />
        <span>1.23 ETH</span>
      </div>
    </div>
  )
}


const generateCss = (scheme: ColorScheme, theme: Theme): string => {
  const meta = colorSchemes.find((entry) => entry.id === scheme)!
  const isDark = theme === 'dark'

  if (isDark) {
    return `.tx-dark.tx-color-${scheme} {
  --tx-color-primary: oklch(0.65 0.22 ${meta.hue});
  --tx-color-primary-hover: oklch(0.72 0.23 ${meta.hue});
  --tx-color-primary-active: oklch(0.58 0.20 ${meta.hue});
  --tx-color-primary-alpha: oklch(0.65 0.22 ${meta.hue} / 0.15);
  --tx-color-ring: oklch(0.65 0.22 ${meta.hue} / 0.5);
}`
  }

  return `.tx-color-${scheme} {
  --tx-color-primary: oklch(0.585 0.233 ${meta.hue});
  --tx-color-primary-hover: oklch(0.540 0.245 ${meta.hue});
  --tx-color-primary-active: oklch(0.480 0.250 ${meta.hue});
  --tx-color-primary-alpha: oklch(0.585 0.233 ${meta.hue} / 0.1);
  --tx-color-ring: oklch(0.585 0.233 ${meta.hue} / 0.4);
}`
}


const ThemeShowcase: React.FC = () => {
  const [ previewTheme, setPreviewTheme ] = useState<Theme>('dark')
  const [ selectedScheme, setSelectedScheme ] = useState<ColorScheme>('indigo')

  const previewClass = previewTheme === 'dark' ? 'tx-dark' : 'tx-light'
  const selectedMeta = colorSchemes.find((entry) => entry.id === selectedScheme)!

  return (
    <div className="tshow">
      <section className="tshow-section">
        <header className="tshow-section-header">
          <div className="tshow-section-titles">
            <h3 className="tshow-section-title">All schemes × variants</h3>
            <p className="tshow-section-hint">Click a row to select - others fade. Hover any row to peek.</p>
          </div>
          <div className="playground-toolbar-buttons">
            {
              themes.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  className={cx('playground-toolbar-btn', { active: previewTheme === tone })}
                  onClick={() => setPreviewTheme(tone)}
                >
                  {tone}
                </button>
              ))
            }
          </div>
        </header>

        <div className={cx('tshow-grid', previewClass)}>
          <div className="tshow-grid-header">
            <div />
            {
              variants.map((variant) => (
                <div key={variant.id} className="tshow-grid-col-label">{variant.label}</div>
              ))
            }
          </div>
          {
            colorSchemes.map((scheme) => {
              const isSelected = selectedScheme === scheme.id
              const swatchColor = `oklch(0.585 0.233 ${scheme.hue})`
              const rowStyle = { '--scheme-color': swatchColor } as React.CSSProperties

              return (
                <div
                  key={scheme.id}
                  className={cx('tshow-grid-row', { 'tshow-grid-row-selected': isSelected })}
                  style={rowStyle}
                >
                  <button
                    type="button"
                    className={cx('tshow-grid-row-label', { active: isSelected })}
                    onClick={() => setSelectedScheme(scheme.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="tshow-swatch" />
                    <span className="tshow-row-label-text">{scheme.label}</span>
                    <ChevronRightIcon className="tshow-row-chevron" size={14} />
                  </button>
                  {
                    variants.map((variant) => (
                      <div key={variant.id} className={cx('tshow-grid-cell', previewClass)}>
                        <MiniCell scheme={scheme.id} variant={variant.id} />
                      </div>
                    ))
                  }
                </div>
              )
            })
          }
        </div>
      </section>

      <section className="tshow-section">
        <header className="tshow-section-header">
          <div className="tshow-section-titles">
            <h3 className="tshow-section-title">Copy theme</h3>
            <p className="tshow-section-hint">
              Showing CSS for{' '}
              <strong className="tshow-hint-strong">{selectedMeta.label}</strong>
              {' · '}
              {previewTheme}
            </p>
          </div>
        </header>
        <CodeBlock
          code={generateCss(selectedScheme, previewTheme)}
          language="css"
          showLineNumbers={false}
        />
      </section>

      <section className="tshow-section">
        <header className="tshow-section-header">
          <div className="tshow-section-titles">
            <h3 className="tshow-section-title">Tokens used</h3>
            <p className="tshow-section-hint">Five CSS custom properties drive every scheme + theme combination.</p>
          </div>
        </header>
        <div className="tshow-tokens-grid">
          {
            tokenList.map((token) => (
              <code key={token} className="tshow-token-pill">{token}</code>
            ))
          }
        </div>
      </section>
    </div>
  )
}


export default ThemeShowcase
