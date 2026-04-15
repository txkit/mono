import { erc20Abi } from 'viem'
import { ContractForm } from '@txkit/react'

import { StorySection } from '../../components'
import dedent from '../../helpers/dedent'
import { USDC_ADDRESS } from '../../config'
import SAMPLE_ABI from './sampleAbi'
import HeadlessFormExample from './HeadlessExample'


const ExamplesTab = () => (
  <>
    <p className="story-description">Code examples and advanced usage patterns</p>
    <StorySection
      id="transfer"
      title="ERC-20 Transfer"
      description="Simple token transfer form with address and amount fields"
      code={dedent`
        <ContractForm
          address={USDC_ADDRESS}
          abi={erc20Abi}
          functionName="transfer"
          onSuccess={(receipt) => console.log('Confirmed:', receipt.transactionHash)}
        />
      `}
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
      code={dedent`
        <ContractForm
          address={USDC_ADDRESS}
          abi={erc20Abi}
          functionName="approve"
          labels={{ securityWarning: 'Security Warning' }}
        />
      `}
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
      code={dedent`
        <ContractForm
          address="0x..."
          abi={contractAbi}
          functionName="registerUser"
        />
      `}
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
      code={dedent`
        <ContractForm address={USDC_ADDRESS} abi={erc20Abi} functionName="transfer">
          {({ fields, values, errors, isValid, setFieldValue }) => (
            <div>Custom UI here</div>
          )}
        </ContractForm>
      `}
    >
      <ContractForm address={USDC_ADDRESS} abi={erc20Abi} functionName="transfer">
        {({ fields, values, errors, touched, isValid, setFieldValue, setFieldTouched }) => (
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--pg-muted-fg)', marginBottom: 12 }}>
              Custom render - {fields.length} fields, valid: {String(isValid)}
            </div>
            {fields.map((field) => (
              <div key={field.name} style={{ marginBottom: 8 }}>
                <input
                  placeholder={`${field.name} (${field.solidityType})`}
                  value={values[field.name] || ''}
                  onChange={(event) => setFieldValue(field.name, event.target.value)}
                  onBlur={() => setFieldTouched(field.name)}
                  className="control-input"
                  style={touched[field.name] && errors[field.name] ? { borderColor: 'var(--pg-destructive)' } : undefined}
                />
                {
                  touched[field.name] && errors[field.name] && (
                    <div style={{ color: 'var(--pg-destructive)', fontSize: 11, marginTop: 2 }}>
                      {errors[field.name]}
                    </div>
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
      code={dedent`
        const {
          fields, values, errors, warnings,
          isValid, calldataPreview,
          setFieldValue, setFieldTouched,
        } = useContractForm({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'transfer',
        })
      `}
    >
      <HeadlessFormExample />
    </StorySection>
  </>
)


export default ExamplesTab
