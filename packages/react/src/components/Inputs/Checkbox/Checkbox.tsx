'use client'
import React, { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import maskStyle from '../../../helpers/maskStyle'
import checkSmall from '../../../assets/icons/check-small.svg'

import '../Inputs.css'


const checkMaskStyle = maskStyle(checkSmall)


export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Visible label next to the checkbox */
  label?: string
  /** Helper text shown below when there's no error */
  helperText?: string
  /** Error message replaces helper text */
  error?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
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
      className={cx('tx-checkbox-wrap', className)}
      data-disabled={disabled ? 'true' : undefined}
      data-error={error ? 'true' : undefined}
    >
      <label className="tx-checkbox" htmlFor={id}>
        <span className="tx-checkbox-control">
          <input
            {...rest}
            ref={ref}
            id={id}
            type="checkbox"
            className="tx-checkbox-input"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={helperId}
          />
          <span className="tx-checkbox-mark" style={checkMaskStyle} aria-hidden="true" />
        </span>
        {
          label && (
            <span className="tx-checkbox-label">{label}</span>
          )
        }
      </label>
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
Checkbox.displayName = 'Checkbox'


export default Checkbox
