import React, { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import './Inputs.css'


export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  /** Visible label above the select */
  label?: string
  /** Helper text shown below when there's no error */
  helperText?: string
  /** Error message replaces helper text and tints the field */
  error?: string
  /** Options rendered as <option> elements */
  options: SelectOption[]
  /** Placeholder shown as first disabled option */
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  const {
    label,
    helperText,
    error,
    options,
    placeholder,
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
      <div className="txkit-input-control txkit-select-control">
        <select
          {...rest}
          ref={ref}
          id={id}
          className="txkit-input-field txkit-select-field"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
        >
          {
            placeholder && (
              <option value="" disabled>{placeholder}</option>
            )
          }
          {
            options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          }
        </select>
        <svg className="txkit-select-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
Select.displayName = 'Select'


export default Select
