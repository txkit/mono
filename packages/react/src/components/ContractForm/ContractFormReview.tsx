import React, { useCallback } from 'react'

import type { ContractFormLabels } from './labels'
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

const CalldataPreview: React.FC<{ preview: string; labels: ContractFormLabels }> = ({ preview, labels }) => {
  const handleCopy = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(preview)
    }
  }, [ preview ])

  return (
    <details className="txkit-cf-review">
      <summary>{labels.reviewTransaction}</summary>
      <div className="txkit-cf-review-content">
        <pre className="txkit-cf-calldata">{preview}</pre>
        <button
          type="button"
          className="txkit-cf-copy"
          aria-label={labels.copyCalldata}
          onClick={handleCopy}
        >
          Copy
        </button>
      </div>
    </details>
  )
}


export { WarningBanner, CalldataPreview }
