import React, { useId, forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import xIcon from '../../assets/icons/x-small.svg'
import checkIcon from '../../assets/icons/check-small.svg'
import warningIcon from '../../assets/icons/warning-small.svg'
import spinnerIcon from '../../assets/icons/spinner.svg'

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

const iconByValidity: Record<Exclude<AddressValidity, 'idle'>, string> = {
  valid: checkIcon,
  invalid: xIcon,
  warning: warningIcon,
  checking: spinnerIcon,
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
  const iconUrl = validity !== 'idle' ? iconByValidity[validity] : undefined
  const iconMaskStyle = iconUrl
    ? { maskImage: `url("${iconUrl}")`, WebkitMaskImage: `url("${iconUrl}")` }
    : undefined

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
          iconMaskStyle && (
            <span
              className={cx('txkit-input-indicator', `txkit-input-indicator--${validity}`)}
              aria-hidden="true"
              style={iconMaskStyle}
            />
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
