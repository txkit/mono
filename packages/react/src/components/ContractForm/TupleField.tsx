import React from 'react'

import type { FieldProps } from './ContractFormFields'


const TupleField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => (
  <details className="txkit-cf-tuple" open>
    <summary>
      {field.internalType ?? 'struct'}
      <span className="txkit-cf-tuple-type">{field.solidityType}</span>
    </summary>
    <div className="txkit-cf-tuple-content">
      <textarea
        id={`txkit-cf-${field.name}`}
        className="txkit-cf-input txkit-cf-input--textarea"
        placeholder={field.components
          ? `{"${field.components.map((component) => component.name).join('": ..., "')}"  : ...}`
          : '{"key": "value"}'}
        rows={Math.max(3, (field.components?.length ?? 1) + 1)}
        value={value}
        disabled={disabled}
        aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
        aria-invalid={touched && Boolean(error)}
        aria-required
        onChange={(event) => onChange(field.name, event.target.value)}
        onBlur={() => onBlur(field.name)}
      />
    </div>
  </details>
)


export default TupleField
