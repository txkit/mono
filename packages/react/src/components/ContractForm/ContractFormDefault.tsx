import React from 'react'

import TransactionButton from '../TransactionButton/TransactionButton'
import { WarningBanner, CalldataPreview } from './ContractFormReview'
import { renderFieldInput, getFieldHint, PayableValueField } from './ContractFormFields'
import type { FieldProps } from './ContractFormFields'

import type { ContractFormLabels } from './labels'
import type { ContractFormRenderData } from '../../types/contract'
import type { FlowStep, StepResult } from '../../types/transaction'


type ContractFormDefaultProps = ContractFormRenderData & {
  label: string
  labels: ContractFormLabels
  steps: FlowStep[]
  disabled?: boolean
  chainId?: number
  onFlowComplete?: (results: Record<string, StepResult>) => void
  onError?: (error: { code: string; message: string; cause?: Error }, stepId: string) => void
}


const ContractFormDefault: React.FC<ContractFormDefaultProps> = ({
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
}) => {
  // Separate payable value field from regular fields
  const valueField = fields.find((field) => field.isPayableValue)
  const regularFields = fields.filter((field) => !field.isPayableValue)

  return (
    <>
      {
        formError && (
          <div className="txkit-cf-form-error" role="alert">
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
          const fieldProps: FieldProps = {
            field,
            value: values[field.name] ?? '',
            error: errors[field.name] ?? null,
            touched: Boolean(touched[field.name]),
            disabled,
            onChange: setFieldValue,
            onBlur: setFieldTouched,
          }

          return (
            <div key={field.name} className="txkit-cf-field" data-type={field.fieldType}>
              <label className="txkit-cf-label" htmlFor={`txkit-cf-${field.name}`}>
                {field.name}
                <span className="txkit-cf-type">{field.solidityType}</span>
              </label>

              {
                hint && (
                  <p id={`txkit-cf-${field.name}-hint`} className="txkit-cf-hint">
                    {hint}
                  </p>
                )
              }

              {renderFieldInput(fieldProps, labels)}

              {
                fieldProps.touched && fieldProps.error && (
                  <span
                    id={`txkit-cf-${field.name}-error`}
                    className="txkit-cf-error"
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
          <div className="txkit-cf-warnings">
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

      <div role="status" aria-live="polite" className="txkit-cf-sr">
        {formError ? formError : ''}
      </div>
    </>
  )
}


export default ContractFormDefault
