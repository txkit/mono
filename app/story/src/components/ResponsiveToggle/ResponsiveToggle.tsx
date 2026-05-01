import React from 'react'

import { cx } from '@txkit/core'


type Viewport = 'desktop' | 'tablet' | 'mobile'

type ResponsiveToggleProps = {
  viewport: Viewport
  onChange: (viewport: Viewport) => void
}

const viewports: { id: Viewport; icon: string; label: string; width: string }[] = [
  { id: 'desktop', icon: '🖥', label: 'Desktop', width: '100%' },
  { id: 'tablet', icon: '📱', label: '768px', width: '768px' },
  { id: 'mobile', icon: '📲', label: '375px', width: '375px' },
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
          aria-label={`${v.id} viewport (${v.width})`}
          title={`${v.id} (${v.width})`}
        >
          <span aria-hidden="true">{v.icon}</span>
          <span className="responsive-toggle-label">{v.label}</span>
        </button>
      ))
    }
  </div>
)

export type { Viewport }


export default ResponsiveToggle
