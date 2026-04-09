import React from 'react'


type InfoGridEntry = {
  label: string
  value: string | number | undefined
  mono?: boolean
  color?: string
}

type InfoGridProps = {
  entries: InfoGridEntry[]
}

const InfoGrid: React.FC<InfoGridProps> = ({ entries }) => (
  <div className="story-info-grid">
    {
      entries.map((entry) => (
        <React.Fragment key={entry.label}>
          <span className="story-info-key">{entry.label}</span>
          <span
            className="story-info-value"
            style={{
              fontFamily: entry.mono ? "'IBM Plex Mono', monospace" : undefined,
              fontSize: entry.mono ? 12 : undefined,
              color: entry.color,
            }}
          >
            {entry.value ?? '-'}
          </span>
        </React.Fragment>
      ))
    }
  </div>
)


export default InfoGrid
