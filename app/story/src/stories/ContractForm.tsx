import { useState } from 'react'
import { erc20Abi } from 'viem'
import {
  TxKitProvider,
  ContractForm,
  useContractForm,
} from '@txkit/react'

import StorySection from '../StorySection'
import useControls from '../controls/useControls'
import ControlPanel from '../controls/ControlPanel'
import { defaultConfig, useStoryConfig, USDC_ADDRESS } from '../config'


const SAMPLE_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [ { name: '', type: 'bool' } ],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [ { name: '', type: 'bool' } ],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'multicall',
    stateMutability: 'payable',
    inputs: [
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [ { name: 'results', type: 'bytes[]' } ],
  },
  {
    type: 'function',
    name: 'registerUser',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'uint8' },
      { name: 'active', type: 'bool' },
      { name: 'referrer', type: 'address' },
    ],
    outputs: [],
  },
] as const


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


const ContractFormStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)

  const { values, entries, reset } = useControls({
    functionName: {
      type: 'select' as const,
      default: 'transfer',
      options: [ 'transfer', 'approve', 'setApprovalForAll', 'multicall', 'registerUser' ],
    },
    label: { type: 'string' as const, default: '' },
    disabled: { type: 'boolean' as const, default: false },
  })

  const [ lastResult, setLastResult ] = useState<string>('')

  return (
    <TxKitProvider config={config}>
      <div>
        <StorySection
          id="interactive"
          title="Interactive"
          description="Live ContractForm with configurable props"
          code={`<ContractForm\n  address="${USDC_ADDRESS}"\n  abi={contractAbi}\n  functionName="${values.functionName}"\n  onSuccess={(receipt) => console.log(receipt)}\n/>`}
        >
          <ControlPanel
            entries={entries}
            onReset={reset}
          />
          <ContractForm
            address={USDC_ADDRESS}
            abi={SAMPLE_ABI}
            functionName={values.functionName}
            label={values.label || undefined}
            disabled={values.disabled}
            onSuccess={(receipt) => setLastResult(`Confirmed: ${receipt.transactionHash}`)}
            onError={(error) => setLastResult(`Error: ${error.message}`)}
          />
          {
            lastResult && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>{lastResult}</div>
            )
          }
        </StorySection>

        <StorySection
          id="transfer"
          title="ERC-20 Transfer"
          description="Simple token transfer form with address and amount fields"
          code={`<ContractForm\n  address={USDC_ADDRESS}\n  abi={erc20Abi}\n  functionName="transfer"\n  onSuccess={(receipt) => console.log('Confirmed:', receipt.transactionHash)}\n/>`}
        >
          <ContractForm
            address={USDC_ADDRESS}
            abi={erc20Abi}
            functionName="transfer"
            onSuccess={(receipt) => console.log('Confirmed:', receipt.transactionHash)}
          />
        </StorySection>

        <StorySection
          id="security-warnings"
          title="Security Warnings"
          description="Dangerous functions show warnings. Try approve with MAX_UINT256 for unlimited approval warning"
          code={`<ContractForm\n  address={USDC_ADDRESS}\n  abi={erc20Abi}\n  functionName="approve"\n  labels={{ securityWarning: 'Security Warning' }}\n/>`}
        >
          <ContractForm
            address={USDC_ADDRESS}
            abi={erc20Abi}
            functionName="approve"
          />
        </StorySection>

        <StorySection
          id="mixed-types"
          title="Mixed Types"
          description="Form with string, uint8, bool, and address fields"
          code={`<ContractForm\n  address="0x..."\n  abi={contractAbi}\n  functionName="registerUser"\n/>`}
        >
          <ContractForm
            address={USDC_ADDRESS}
            abi={SAMPLE_ABI}
            functionName="registerUser"
          />
        </StorySection>

        <StorySection
          id="custom-render"
          title="Custom Render (Tier 2)"
          description="Custom form UI via children render function"
          code={`<ContractForm address={USDC_ADDRESS} abi={erc20Abi} functionName="transfer">\n  {({ fields, values, errors, isValid, setFieldValue }) => (\n    <div>Custom UI here</div>\n  )}\n</ContractForm>`}
        >
          <ContractForm address={USDC_ADDRESS} abi={erc20Abi} functionName="transfer">
            {({ fields, values, errors, touched, isValid, setFieldValue, setFieldTouched }) => (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>
                  Custom render - {fields.length} fields, valid: {String(isValid)}
                </div>
                {fields.map((field) => (
                  <div key={field.name} style={{ marginBottom: 8 }}>
                    <input
                      placeholder={`${field.name} (${field.solidityType})`}
                      value={values[field.name] || ''}
                      onChange={(event) => setFieldValue(field.name, event.target.value)}
                      onBlur={() => setFieldTouched(field.name)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${touched[field.name] && errors[field.name] ? '#ef4444' : '#334155'}`,
                        background: '#0F172A',
                        color: '#F1F5F9',
                        fontSize: 14,
                      }}
                    />
                    {
                      touched[field.name] && errors[field.name] && (
                        <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{errors[field.name]}</div>
                      )
                    }
                  </div>
                ))}
              </div>
            )}
          </ContractForm>
        </StorySection>

        <StorySection
          id="headless"
          title="Headless Hook (Tier 3)"
          description="Headless - your UI, txKit logic. Full control with useContractForm hook"
          headless
          code={`const {\n  fields, values, errors, warnings,\n  isValid, calldataPreview,\n  setFieldValue, setFieldTouched,\n} = useContractForm({\n  address: USDC_ADDRESS,\n  abi: erc20Abi,\n  functionName: 'transfer',\n})`}
        >
          <HeadlessFormExample />
        </StorySection>
      </div>
    </TxKitProvider>
  )
}


export default ContractFormStory
