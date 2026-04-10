import React from 'react'

import type { SecurityWarning } from '../../types/contract'


const WarningIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="18" height="18">
    <path d="M9.13 2.5L1.5 15.5C1.1 16.2 1.6 17 2.37 17H17.63C18.4 17 18.9 16.2 18.5 15.5L10.87 2.5C10.49 1.8 9.51 1.8 9.13 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M10 8V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="14" r="1" fill="currentColor" />
  </svg>
)

const DangerIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="18" height="18">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="13.5" r="1" fill="currentColor" />
  </svg>
)

const WarningBanner: React.FC<{ warning: SecurityWarning }> = ({ warning }) => (
  <div
    className="txkit-cf-warning"
    data-level={warning.level}
    role={warning.level === 'danger' ? 'alert' : 'status'}
    aria-live={warning.level === 'danger' ? 'assertive' : 'polite'}
  >
    <span className="txkit-cf-warning-icon" aria-hidden="true">
      {warning.level === 'danger' ? <DangerIcon /> : <WarningIcon />}
    </span>
    <span className="txkit-cf-warning-message">{warning.message}</span>
  </div>
)


export default WarningBanner
