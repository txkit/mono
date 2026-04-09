import { erc20Abi } from 'viem'
import { useContractForm } from '@txkit/react'

import { USDC_ADDRESS } from '../../config'


const HeadlessFormExample = () => {
  const {
    fields,
    values,
    errors,
    touched,
    warnings,
    isValid,
    isPayable,
    calldataPreview,
    setFieldValue,
    setFieldTouched,
  } = useContractForm({
    abi: erc20Abi,
    address: USDC_ADDRESS,
    functionName: 'transfer',
  })

  return (
    <div>
      <div className="story-info-grid">
        <span className="story-info-key">Fields</span>
        <span className="story-info-value">{fields.length}</span>
        <span className="story-info-key">Valid</span>
        <span className="story-info-value">{isValid ? 'Yes' : 'No'}</span>
        <span className="story-info-key">Payable</span>
        <span className="story-info-value">{isPayable ? 'Yes' : 'No'}</span>
        <span className="story-info-key">Warnings</span>
        <span className="story-info-value">{warnings.length}</span>
      </div>
      <div style={{ marginTop: 12 }}>
        {fields.map((field) => (
          <div key={field.name} style={{ marginBottom: 8 }}>
            <label
              htmlFor={`headless-${field.name}`}
              style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}
            >
              {field.name} ({field.solidityType})
            </label>
            <input
              id={`headless-${field.name}`}
              type="text"
              value={values[field.name] || ''}
              aria-invalid={Boolean(touched[field.name] && errors[field.name])}
              aria-describedby={touched[field.name] && errors[field.name] ? `headless-${field.name}-error` : undefined}
              onChange={(event) => setFieldValue(field.name, event.target.value)}
              onBlur={() => setFieldTouched(field.name)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: `1px solid ${touched[field.name] && errors[field.name] ? '#ef4444' : '#334155'}`,
                background: '#1E293B',
                color: '#F1F5F9',
                fontSize: 13,
              }}
            />
            {
              touched[field.name] && errors[field.name] && (
                <div id={`headless-${field.name}-error`} style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>
                  {errors[field.name]}
                </div>
              )
            }
          </div>
        ))}
      </div>
      {
        calldataPreview && (
          <pre style={{ fontSize: 10, color: '#64748B', marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {calldataPreview}
          </pre>
        )
      }
    </div>
  )
}


export default HeadlessFormExample
