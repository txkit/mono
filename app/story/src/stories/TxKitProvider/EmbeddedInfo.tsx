import React from 'react'
import { useTxKit } from '@txkit/react'


const EmbeddedInfo: React.FC = () => {
  const { theme, config } = useTxKit()

  return (
    <div className="story-info-grid" style={{ marginTop: 12 }}>
      <span className="story-info-key">Embedded</span>
      <span className="story-info-value">{String(config.embedded)}</span>
      <span className="story-info-key">Theme</span>
      <span className="story-info-value">{theme}</span>
      <span className="story-info-key">Chains</span>
      <span className="story-info-value">{config.chains.map((c) => c.name).join(', ')}</span>
    </div>
  )
}


export default EmbeddedInfo
