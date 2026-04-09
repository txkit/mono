import { erc20Abi } from 'viem'
import {
  TxKitProvider,
  ContractForm,
} from '@txkit/react'

import StorySection from '../../StorySection'
import { USDC_ADDRESS } from '../../config'
import SAMPLE_ABI from './sampleAbi'
import HeadlessFormExample from './HeadlessExample'


const CfExamplesTab = ({ config }: { config: TxKit.Config }) => (
  <TxKitProvider config={config}>
    <p className="story-description">Code examples and advanced usage patterns</p>
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
  </TxKitProvider>
)


export default CfExamplesTab
