import React, { useState } from 'react'
import { cx } from '@txkit/core'

import CodeBlock from '../../components/CodeBlock/CodeBlock'

import './ThemeShowcase.css'


type ColorScheme = 'violet' | 'indigo' | 'emerald' | 'amber'
type Variant = 'default' | 'soft' | 'sharp' | 'rounded'
type Theme = 'light' | 'dark'

const colorSchemes: readonly { id: ColorScheme; label: string; hue: number }[] = [
  { id: 'indigo', label: 'Indigo', hue: 276 },
  { id: 'violet', label: 'Violet', hue: 292 },
  { id: 'emerald', label: 'Emerald', hue: 155 },
  { id: 'amber', label: 'Amber', hue: 65 },
]

const variants: readonly { id: Variant; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'soft', label: 'Soft' },
  { id: 'sharp', label: 'Sharp' },
  { id: 'rounded', label: 'Rounded' },
]

const themes: readonly Theme[] = [ 'light', 'dark' ]


const MiniCell: React.FC<{ scheme: ColorScheme; variant: Variant }> = ({ scheme, variant }) => (
  <div className={`tshow-cell txkit-root txkit-color-${scheme} txkit-${variant === 'default' ? '' : variant}`}>
    <button type="button" className="tshow-btn">Action</button>
    <div className="tshow-input">0x742d...4a9c</div>
    <div className="tshow-token">
      <span className="tshow-token-dot" />
      <span>1.23 ETH</span>
    </div>
  </div>
)


const generateCss = (scheme: ColorScheme, theme: Theme): string => {
  const hue = colorSchemes.find((c) => c.id === scheme)!.hue
  const isDark = theme === 'dark'

  if (isDark) {
    return `.txkit-dark.txkit-color-${scheme} {
  --txkit-color-primary: oklch(0.65 0.22 ${hue});
  --txkit-color-primary-hover: oklch(0.72 0.23 ${hue});
  --txkit-color-primary-active: oklch(0.58 0.20 ${hue});
  --txkit-color-primary-alpha: oklch(0.65 0.22 ${hue} / 0.15);
  --txkit-color-ring: oklch(0.65 0.22 ${hue} / 0.5);
}`
  }

  return `.txkit-color-${scheme} {
  --txkit-color-primary: oklch(0.585 0.233 ${hue});
  --txkit-color-primary-hover: oklch(0.540 0.245 ${hue});
  --txkit-color-primary-active: oklch(0.480 0.250 ${hue});
  --txkit-color-primary-alpha: oklch(0.585 0.233 ${hue} / 0.1);
  --txkit-color-ring: oklch(0.585 0.233 ${hue} / 0.4);
}`
}


const ThemeShowcase: React.FC = () => {
  const [ previewTheme, setPreviewTheme ] = useState<Theme>('dark')
  const [ selectedScheme, setSelectedScheme ] = useState<ColorScheme>('violet')

  return (
    <div className="tshow">
      <div className="tshow-section">
        <div className="tshow-section-header">
          <h3 className="tshow-section-title">All schemes × variants</h3>
          <div className="playground-toolbar-buttons">
            {
              themes.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={cx('playground-toolbar-btn', { active: previewTheme === t })}
                  onClick={() => setPreviewTheme(t)}
                >
                  {t}
                </button>
              ))
            }
          </div>
        </div>

        <div className={`tshow-grid ${previewTheme === 'dark' ? 'tshow-grid-dark' : 'tshow-grid-light'}`}>
          <div className="tshow-grid-header">
            <div />
            {
              variants.map((v) => (
                <div key={v.id} className="tshow-grid-col-label">{v.label}</div>
              ))
            }
          </div>
          {
            colorSchemes.map((scheme) => (
              <div key={scheme.id} className="tshow-grid-row">
                <button
                  type="button"
                  className={`tshow-grid-row-label ${selectedScheme === scheme.id ? 'active' : ''}`}
                  onClick={() => setSelectedScheme(scheme.id)}
                >
                  <span
                    className="tshow-swatch"
                    style={{ background: `oklch(0.65 0.22 ${scheme.hue})` }}
                  />
                  {scheme.label}
                </button>
                {
                  variants.map((variant) => (
                    <div key={variant.id} className={`tshow-grid-cell ${previewTheme === 'dark' ? 'txkit-dark' : ''}`}>
                      <MiniCell scheme={scheme.id} variant={variant.id} />
                    </div>
                  ))
                }
              </div>
            ))
          }
        </div>
      </div>

      <div className="tshow-section">
        <h3 className="tshow-section-title">Copy theme ({selectedScheme}, {previewTheme})</h3>
        <CodeBlock code={generateCss(selectedScheme, previewTheme)} language="css" showLineNumbers={false} />
      </div>
    </div>
  )
}


export default ThemeShowcase
