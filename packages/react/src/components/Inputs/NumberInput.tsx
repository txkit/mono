import React, { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import './Inputs.css'


export type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  /** Visible label above the input */
  label?: string
  /** Helper text shown below when there's no error */
  helperText?: string
  /** Error message replaces helper text and tints the field */
  error?: string
  /** Currency or token symbol shown as right-aligned suffix (e.g. "ETH", "USDC") */
  unit?: string
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>((props, ref) => {
  const {
    label,
    helperText,
    error,
    unit,
    id: idProp,
    className,
    disabled,
    ...rest
  } = props

  const generatedId = useId()
  const id = idProp ?? generatedId
  const helperId = helperText || error ? `${id}-helper` : undefined

  return (
    <div
      className={cx('txkit-input', className)}
      data-disabled={disabled ? 'true' : undefined}
      data-error={error ? 'true' : undefined}
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
          inputMode="decimal"
          data-type="number"
          className="txkit-input-field"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
        />
        {
          unit && (
            <span className="txkit-input-unit" aria-hidden="true">{unit}</span>
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
NumberInput.displayName = 'NumberInput'


export default NumberInput
