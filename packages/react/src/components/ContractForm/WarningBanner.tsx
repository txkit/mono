import React from 'react'

import type { SecurityWarning } from '../../types/contract'


const WarningBanner: React.FC<{ warning: SecurityWarning }> = ({ warning }) => (
  <div
    className="txkit-cf-warning"
    data-level={warning.level}
    role={warning.level === 'danger' ? 'alert' : 'status'}
    aria-live={warning.level === 'danger' ? 'assertive' : 'polite'}
  >
    {warning.message}
  </div>
)


export default WarningBanner
