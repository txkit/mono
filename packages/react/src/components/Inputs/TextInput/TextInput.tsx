'use client'
import React, { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import '../Inputs.css'


export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Visible label above the input */
  label?: string
  /** Helper text shown below when there's no error */
  helperText?: string
  /** Error message replaces helper text and tints the field */
  error?: string
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  const {
    label,
    helperText,
    error,
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
      className={cx('tx-input', className)}
      data-disabled={disabled ? 'true' : undefined}
      data-error={error ? 'true' : undefined}
    >
      {
        label && (
          <label className="tx-input-label" htmlFor={id}>
            {label}
          </label>
        )
      }
      <div className="tx-input-control">
        <input
          {...rest}
          ref={ref}
          id={id}
          type="text"
          className="tx-input-field"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
        />
      </div>
      {
        error
          ? (
            <span className="tx-input-error" id={helperId} role="alert">
              {error}
            </span>
          )
          : helperText && (
            <span className="tx-input-helper" id={helperId}>
              {helperText}
            </span>
          )
      }
    </div>
  )
})
TextInput.displayName = 'TextInput'


export default TextInput
