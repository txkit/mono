import React, { type ChangeEvent } from 'react'

import type { ContractFormLabels } from './labels'
import type { FieldDescriptor } from '../../types/contract'


type FieldProps = {
  field: FieldDescriptor
  value: string
  error: string | null
  touched: boolean
  disabled?: boolean
  onChange: (name: string, value: string) => void
  onBlur: (name: string) => void
}

const AddressField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => (
  <input
    id={`txkit-cf-${field.name}`}
    className="txkit-cf-input"
    type="text"
    inputMode="text"
    placeholder="0x..."
    value={value}
    disabled={disabled}
    aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
    aria-invalid={touched && Boolean(error)}
    aria-required
    onChange={(event) => onChange(field.name, event.target.value)}
    onBlur={() => onBlur(field.name)}
  />
)

const IntegerField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => (
  <input
    id={`txkit-cf-${field.name}`}
    className="txkit-cf-input"
    type="text"
    inputMode="numeric"
    placeholder="0"
    value={value}
    disabled={disabled}
    aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
    aria-invalid={touched && Boolean(error)}
    aria-required
    onChange={(event) => onChange(field.name, event.target.value)}
    onBlur={() => onBlur(field.name)}
  />
)

const BoolField: React.FC<FieldProps> = ({ field, value, disabled, onChange }) => (
  <label className="txkit-cf-checkbox-row">
    <input
      id={`txkit-cf-${field.name}`}
      className="txkit-cf-checkbox"
      type="checkbox"
      checked={value === 'true'}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field.name, event.target.checked ? 'true' : 'false')}
    />
    <span className="txkit-cf-checkbox-label">
      {value === 'true' ? 'true' : 'false'}
    </span>
  </label>
)

const StringField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => (
  <input
    id={`txkit-cf-${field.name}`}
    className="txkit-cf-input txkit-cf-input--string"
    type="text"
    placeholder="..."
    value={value}
    disabled={disabled}
    aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
    aria-invalid={touched && Boolean(error)}
    aria-required
    onChange={(event) => onChange(field.name, event.target.value)}
    onBlur={() => onBlur(field.name)}
  />
)

const BytesField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => {
  const isFixed = field.fieldType === 'bytesN'

  if (isFixed) {
    return (
      <input
        id={`txkit-cf-${field.name}`}
        className="txkit-cf-input"
        type="text"
        placeholder="0x..."
        maxLength={2 + (field.byteLength ?? 0) * 2}
        value={value}
        disabled={disabled}
        aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
        aria-invalid={touched && Boolean(error)}
        aria-required
        onChange={(event) => onChange(field.name, event.target.value)}
        onBlur={() => onBlur(field.name)}
      />
    )
  }

  return (
    <textarea
      id={`txkit-cf-${field.name}`}
      className="txkit-cf-input txkit-cf-input--textarea"
      placeholder="0x..."
      rows={3}
      value={value}
      disabled={disabled}
      aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
      aria-invalid={touched && Boolean(error)}
      aria-required
      onChange={(event) => onChange(field.name, event.target.value)}
      onBlur={() => onBlur(field.name)}
    />
  )
}

const ArrayField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => (
  <textarea
    id={`txkit-cf-${field.name}`}
    className="txkit-cf-input txkit-cf-input--textarea"
    placeholder={`["value1", "value2"]`}
    rows={3}
    value={value}
    disabled={disabled}
    aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
    aria-invalid={touched && Boolean(error)}
    aria-required
    onChange={(event) => onChange(field.name, event.target.value)}
    onBlur={() => onBlur(field.name)}
  />
)

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

const UnsupportedField: React.FC<{ labels: ContractFormLabels }> = ({ labels }) => (
  <div className="txkit-cf-unsupported">
    {labels.unsupportedType}
  </div>
)

const PayableValueField: React.FC<FieldProps & { labels: ContractFormLabels }> = ({
  field, value, error, touched, disabled, labels, onChange, onBlur,
}) => (
  <div className="txkit-cf-field" data-type="value">
    <label className="txkit-cf-label" htmlFor={`txkit-cf-${field.name}`}>
      {labels.payableValue}
    </label>
    <input
      id={`txkit-cf-${field.name}`}
      className="txkit-cf-input"
      type="text"
      inputMode="decimal"
      placeholder="0.0"
      value={value}
      disabled={disabled}
      aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
      aria-invalid={touched && Boolean(error)}
      onChange={(event) => onChange(field.name, event.target.value)}
      onBlur={() => onBlur(field.name)}
    />
    {
      touched && error && (
        <span
          id={`txkit-cf-${field.name}-error`}
          className="txkit-cf-error"
          role="alert"
        >
          {error}
        </span>
      )
    }
  </div>
)


// --- Helper: get hint text ---

const getFieldHint = (field: FieldDescriptor): string | undefined => {
  if (field.fieldType === 'address') {
    return '42 characters starting with 0x'
  }
  if (field.fieldType === 'uint' && field.bitSize && field.bitSize < 256) {
    const maxValue = (1n << BigInt(field.bitSize)) - 1n
    return `uint${field.bitSize}: 0 to ${maxValue}`
  }
  if (field.fieldType === 'int' && field.bitSize && field.bitSize < 256) {
    const minValue = -(1n << BigInt(field.bitSize - 1))
    const maxValue = (1n << BigInt(field.bitSize - 1)) - 1n
    return `int${field.bitSize}: ${minValue} to ${maxValue}`
  }
  if (field.fieldType === 'bytesN' && field.byteLength) {
    return `${field.byteLength} bytes (${field.byteLength * 2} hex characters)`
  }
  if (field.fieldType === 'bytes') {
    return 'Variable length hex data'
  }
  return undefined
}


// --- Helper: render field input by type ---

const renderFieldInput = (props: FieldProps, labels: ContractFormLabels) => {
  switch (props.field.fieldType) {
    case 'address':
      return <AddressField {...props} />
    case 'uint':
    case 'int':
      return <IntegerField {...props} />
    case 'bool':
      return <BoolField {...props} />
    case 'string':
      return <StringField {...props} />
    case 'bytes':
    case 'bytesN':
      return <BytesField {...props} />
    case 'array':
    case 'tupleArray':
      return <ArrayField {...props} />
    case 'tuple':
      return <TupleField {...props} />
    default:
      return <UnsupportedField labels={labels} />
  }
}


export { renderFieldInput, getFieldHint, PayableValueField }
export type { FieldProps }
