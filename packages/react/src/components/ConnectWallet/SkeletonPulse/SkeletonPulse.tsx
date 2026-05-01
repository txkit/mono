import React from 'react'


const SkeletonPulse: React.FC = () => (
  <span className="tx-cw-skeleton" aria-hidden="true">
    <span className="tx-cw-skeleton-avatar" />
    <span className="tx-cw-skeleton-text" />
  </span>
)


export default SkeletonPulse
