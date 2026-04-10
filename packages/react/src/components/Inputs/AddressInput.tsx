import React, { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import './Inputs.css'


export type AddressValidity = 'idle' | 'checking' | 'valid' | 'invalid' | 'warning'

export type AddressInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  /** Visible label above the input */
  label?: string
  /** Helper text shown below when there's no error */
  helperText?: string
  /** Error message replaces helper text and tints the field */
  error?: string
  /** Validity state - controls border color and right-side indicator icon */
  validity?: AddressValidity
}

const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8.5L6.5 12L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WarningIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 5V9M8 11.5V11.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7.13 2.5L1.5 12.5C1.1 13.2 1.6 14 2.37 14H13.63C14.4 14 14.9 13.2 14.5 12.5L8.87 2.5C8.49 1.8 7.51 1.8 7.13 2.5Z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const SpinnerIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M14 8C14 4.68629 11.3137 2 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const indicatorMap: Record<Exclude<AddressValidity, 'idle'>, React.ReactNode> = {
  checking: <SpinnerIcon />,
  valid: <CheckIcon />,
  invalid: <XIcon />,
  warning: <WarningIcon />,
}

const AddressInput = forwardRef<HTMLInputElement, AddressInputProps>((props, ref) => {
  const {
    label,
    helperText,
    error,
    validity = 'idle',
    id: idProp,
    className,
    disabled,
    ...rest
  } = props

  const generatedId = useId()
  const id = idProp ?? generatedId
  const helperId = helperText || error ? `${id}-helper` : undefined
  const stateAttr = validity === 'idle' ? undefined : validity

  return (
    <div
      className={cx('txkit-input', className)}
      data-disabled={disabled ? 'true' : undefined}
      data-error={error ? 'true' : undefined}
      data-state={stateAttr}
    >
      {
        label && (
          <label className="txkit-input-label" htmlFor={id}>
            {label}
          </label>
        )
      }
      <div className="txkit-input-control">
        <input
          {...rest}
          ref={ref}
          id={id}
          type="text"
          data-type="address"
          className="txkit-input-field"
          spellCheck={false}
          autoComplete="off"
          disabled={disabled}
          aria-invalid={error || validity === 'invalid' ? true : undefined}
          aria-describedby={helperId}
        />
        {
          validity !== 'idle' && (
            <span className={cx('txkit-input-indicator', `txkit-input-indicator--${validity}`)}>
              {indicatorMap[validity]}
            </span>
          )
        }
      </div>
      {
        error
          ? (
            <span className="txkit-input-error" id={helperId} role="alert">
              {error}
            </span>
          )
          : helperText && (
            <span className="txkit-input-helper" id={helperId}>
              {helperText}
            </span>
          )
      }
    </div>
  )
})
AddressInput.displayName = 'AddressInput'


export default AddressInput
