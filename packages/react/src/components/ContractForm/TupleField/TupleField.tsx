import React from 'react'

import type { FieldProps } from '../ContractFormFields'


const TupleField: React.FC<FieldProps> = (props) => {
  const { field, value, error, touched, disabled, helperIds, onChange, onBlur } = props
  const placeholder = field.components
    ? `{${field.components.map((component) => `"${component.name}": ...`).join(', ')}}`
    : '{"key": "value"}'

  return (
    <details className="tx-cf-tuple" open>
      <summary>
        {field.internalType ?? 'struct'}
        <span className="tx-cf-tuple-type">{field.solidityType}</span>
      </summary>
      <div className="tx-cf-tuple-content">
        <textarea
          id={`tx-cf-${field.name}`}
          className="tx-cf-input tx-cf-input--textarea"
          placeholder={placeholder}
          rows={Math.max(3, (field.components?.length ?? 1) + 1)}
          value={value}
          disabled={disabled}
          aria-describedby={helperIds}
          aria-invalid={touched && Boolean(error)}
          onChange={(event) => onChange(field.name, event.target.value)}
          onBlur={() => onBlur(field.name)}
        />
      </div>
    </details>
  )
}


export default TupleField
