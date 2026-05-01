import React from 'react'
import type { TransactionError } from '@txkit/core'

import FieldInput from './FieldInput'
import WarningBanner from './WarningBanner'
import CalldataPreview from './CalldataPreview'
import TransactionButton from '../TransactionButton/TransactionButton'
import { buildAriaDescribedBy, getFieldHint, PayableValueField } from './ContractFormFields'
import type { FieldProps } from './ContractFormFields'
import type { ContractFormLabels } from './labels'
import type { FlowStep, StepResult } from '../../types/transaction'
import type { ContractFormRenderData } from '../../types/contract'


type ContractFormDefaultProps = ContractFormRenderData & {
  label: string
  labels: ContractFormLabels
  steps: FlowStep[]
  disabled?: boolean
  chainId?: number
  onFlowComplete?: (results: Record<string, StepResult>) => void
  onError?: (error: TransactionError, stepId: string) => void
}


const ContractFormDefault: React.FC<ContractFormDefaultProps> = (props) => {
  const {
    fields,
    values,
    errors,
    touched,
    warnings,
    calldataPreview,
    isValid,
    formError,
    steps,
    labels,
    label,
    disabled,
    chainId,
    setFieldValue,
    setFieldTouched,
    onFlowComplete,
    onError,
  } = props
  const valueField = fields.find((field) => field.isPayableValue)
  const regularFields = fields.filter((field) => !field.isPayableValue)

  return (
    <>
      {
        formError && (
          <div className="tx-cf-form-error" role="alert">
            {formError}
          </div>
        )
      }

      {
        valueField && (
          <PayableValueField
            field={valueField}
            value={values[valueField.name] ?? ''}
            error={errors[valueField.name] ?? null}
            touched={Boolean(touched[valueField.name])}
            disabled={disabled}
            labels={labels}
            onChange={setFieldValue}
            onBlur={setFieldTouched}
          />
        )
      }

      {
        regularFields.map((field) => {
          const hint = getFieldHint(field)
          const fieldError = errors[field.name] ?? null
          const fieldTouched = Boolean(touched[field.name])
          const fieldProps: FieldProps = {
            field,
            value: values[field.name] ?? '',
            error: fieldError,
            touched: fieldTouched,
            disabled,
            helperIds: buildAriaDescribedBy(field.name, Boolean(hint), fieldTouched && Boolean(fieldError)),
            onChange: setFieldValue,
            onBlur: setFieldTouched,
          }

          return (
            <div key={field.name} className="tx-cf-field" data-type={field.fieldType}>
              <label className="tx-cf-label" htmlFor={`tx-cf-${field.name}`}>
                {field.name}
                <span className="tx-cf-type">{field.solidityType}</span>
              </label>

              {
                hint && (
                  <p id={`tx-cf-${field.name}-hint`} className="tx-cf-hint">
                    {hint}
                  </p>
                )
              }

              <FieldInput {...fieldProps} labels={labels} />

              {
                fieldProps.touched && fieldProps.error && (
                  <span
                    id={`tx-cf-${field.name}-error`}
                    className="tx-cf-error"
                    role="alert"
                  >
                    {fieldProps.error}
                  </span>
                )
              }
            </div>
          )
        })
      }

      {
        warnings.length > 0 && (
          <div className="tx-cf-warnings">
            {
              warnings.map((warning, index) => (
                <WarningBanner key={index} warning={warning} />
              ))
            }
          </div>
        )
      }

      {
        calldataPreview && (
          <CalldataPreview preview={calldataPreview} labels={labels} />
        )
      }

      {
        !formError && (
          <TransactionButton
            steps={steps}
            label={label}
            chainId={chainId}
            disabled={disabled || !isValid}
            onFlowComplete={onFlowComplete}
            onError={onError}
          />
        )
      }

      <div role="status" aria-live="polite" className="tx-cf-sr">
        {formError ? formError : ''}
      </div>
    </>
  )
}


export default ContractFormDefault
