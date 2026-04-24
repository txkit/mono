import React, { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cx } from '@txkit/core'

import '../Inputs.css'


export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Visible label next to the checkbox */
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const {
    label,
    id: idProp,
    className,
    disabled,
    ...rest
  } = props

  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <label
      className={cx('txkit-checkbox', className)}
      htmlFor={id}
      data-disabled={disabled ? 'true' : undefined}
    >
      <span className="txkit-checkbox-control">
        <input
          {...rest}
          ref={ref}
          id={id}
          type="checkbox"
          className="txkit-checkbox-input"
          disabled={disabled}
        />
        <svg className="txkit-checkbox-mark" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {
        label && (
          <span className="txkit-checkbox-label">{label}</span>
        )
      }
    </label>
  )
})
Checkbox.displayName = 'Checkbox'


export default Checkbox
