import React from 'react'

import { cx } from '@txkit/core'


type Viewport = 'desktop' | 'tablet' | 'mobile'

type ResponsiveToggleProps = {
  viewport: Viewport
  onChange: (viewport: Viewport) => void
}

const viewports: { id: Viewport; label: string; width: string }[] = [
  { id: 'desktop', label: '🖥', width: '100%' },
  { id: 'tablet', label: '📱', width: '768px' },
  { id: 'mobile', label: '📲', width: '375px' },
]

const ResponsiveToggle: React.FC<ResponsiveToggleProps> = ({ viewport, onChange }) => (
  <div className="responsive-toggle">
    {
      viewports.map((v) => (
        <button
          key={v.id}
          type="button"
          className={cx('responsive-toggle-btn', { active: viewport === v.id })}
          onClick={() => onChange(v.id)}
          title={`${v.id} (${v.width})`}
        >
          {v.label}
        </button>
      ))
    }
  </div>
)

export type { Viewport }


export default ResponsiveToggle
