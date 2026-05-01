import React from 'react'

import type { FieldProps } from '../ContractFormFields'
import type { ContractFormLabels } from '../labels'


const PayableValueField: React.FC<FieldProps & { labels: ContractFormLabels }> = (props) => {
  const { field, value, error, touched, disabled, labels, onChange, onBlur } = props
  const hasError = touched && Boolean(error)
  const errorId = hasError ? `tx-cf-${field.name}-error` : undefined

  return (
    <div className="tx-cf-field" data-type="value">
      <label className="tx-cf-label" htmlFor={`tx-cf-${field.name}`}>
        {labels.payableValue}
      </label>
      <input
        id={`tx-cf-${field.name}`}
        className="tx-cf-input"
        type="text"
        inputMode="decimal"
        placeholder="0.0"
        value={value}
        disabled={disabled}
        aria-describedby={errorId}
        aria-invalid={hasError}
        onChange={(event) => onChange(field.name, event.target.value)}
        onBlur={() => onBlur(field.name)}
      />
      {
        hasError && (
          <span
            id={errorId}
            className="tx-cf-error"
            role="alert"
          >
            {error}
          </span>
        )
      }
    </div>
  )
}


export default PayableValueField
