'use client'
import React, { useCallback } from 'react'

import type { ContractFormLabels } from '../labels'


const CalldataPreview: React.FC<{ preview: string; labels: ContractFormLabels }> = ({ preview, labels }) => {
  const handleCopy = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(preview)
    }
  }, [ preview ])

  return (
    <details className="tx-cf-review">
      <summary>{labels.reviewTransaction}</summary>
      <div className="tx-cf-review-content">
        <pre className="tx-cf-calldata">{preview}</pre>
        <button
          type="button"
          className="tx-cf-copy"
          aria-label={labels.copyCalldata}
          onClick={handleCopy}
        >
          Copy
        </button>
      </div>
    </details>
  )
}


export default CalldataPreview
