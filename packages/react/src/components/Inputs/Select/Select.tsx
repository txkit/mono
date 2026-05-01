'use client'
import React, { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import maskStyle from '../../../helpers/maskStyle'
import chevronDown from '../../../assets/icons/chevron-down.svg'

import '../Inputs.css'


const chevronMaskStyle = maskStyle(chevronDown)


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
      <div className="tx-input-control tx-select-control">
        <select
          {...rest}
          ref={ref}
          id={id}
          className="tx-input-field tx-select-field"
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
        <span className="tx-select-chevron" style={chevronMaskStyle} aria-hidden="true" />
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
Select.displayName = 'Select'


export default Select
