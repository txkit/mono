import type { Abi, AbiFunction } from 'viem'
import { encodeFunctionData, decodeFunctionData } from 'viem'

import { isMaxApproval } from '@txkit/core'
import type { DecodedCalldata } from '@txkit/core'

import type { FieldDescriptor, SecurityWarning } from '../../../types/contract'


// --- Security ---

const DANGEROUS_FUNCTIONS: Record<string, { level: 'warning' | 'danger'; message: string }> = {
  approve: { level: 'warning', message: 'Grants token spending allowance to another address' },
  setApprovalForAll: { level: 'danger', message: 'Grants full access to ALL tokens in collection' },
  transfer: { level: 'warning', message: 'Sends tokens to another address' },
  transferFrom: { level: 'warning', message: 'Transfers tokens on behalf of another address' },
  delegateCall: { level: 'danger', message: 'Executes arbitrary code in contract context' },
  selfdestruct: { level: 'danger', message: 'Permanently destroys contract' },
  burn: { level: 'warning', message: 'Destroys tokens permanently' },
  burnFrom: { level: 'warning', message: 'Destroys tokens from another address' },
  renounceOwnership: { level: 'danger', message: 'Irreversibly removes contract ownership' },
  transferOwnership: { level: 'warning', message: 'Transfers contract ownership to another address' },
  upgradeTo: { level: 'danger', message: 'Upgrades contract implementation (arbitrary code change)' },
  upgradeToAndCall: { level: 'danger', message: 'Upgrades contract and executes arbitrary call' },
  permit: { level: 'warning', message: 'Grants gasless token spending allowance via signature' },
  multicall: { level: 'warning', message: 'Executes multiple contract calls in one transaction' },
  execute: { level: 'warning', message: 'Executes an arbitrary contract call' },
  withdraw: { level: 'warning', message: 'Withdraws funds from the contract' },
  withdrawAll: { level: 'warning', message: 'Withdraws all funds from the contract' },
  pause: { level: 'warning', message: 'Pauses contract operations' },
  unpause: { level: 'warning', message: 'Resumes contract operations' },
}

export const isDangerousFunction = (functionName: string): boolean => {
  return functionName in DANGEROUS_FUNCTIONS
}

export const getSecurityWarnings = (
  functionName: string,
  values: Record<string, string>,
  fields: FieldDescriptor[]
): SecurityWarning[] => {
  const warnings: SecurityWarning[] = []

  const dangerInfo = DANGEROUS_FUNCTIONS[functionName]
  if (dangerInfo) {
    warnings.push({ level: dangerInfo.level, message: dangerInfo.message })
  }

  // MAX_UINT256 detection for approve
  if (functionName === 'approve') {
    const amountField = fields.find((field) =>
      !field.isPayableValue && (field.fieldType === 'uint' || field.fieldType === 'int'),
    )
    if (amountField) {
      const amountValue = values[amountField.name]
      if (amountValue) {
        try {
          const amount = BigInt(amountValue)
          if (isMaxApproval(amount)) {
            warnings.push({
              level: 'danger',
              message: 'Unlimited approval - grants permanent access to all your tokens of this type',
            })
          }
        } catch {
          // Invalid BigInt, skip check
        }
      }
    }
  }

  return warnings
}


// --- Calldata Preview ---

/** Format arg value showing FULL addresses (no shortening - anti-poisoning) */
const formatArgValueFull = (value: unknown, type: string): string => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (type === 'address' && typeof value === 'string') {
    return value // Full address, NOT shortened
  }
  if (Array.isArray(value)) {
    return `[${value.map((element) => formatArgValueFull(element, type.replace('[]', ''))).join(', ')}]`
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value, (_key, element) => typeof element === 'bigint' ? element.toString() : element)
  }
  return String(value)
}

export const buildCalldataPreview = (
  abi: Abi,
  functionName: string,
  args: unknown[]
): string | undefined => {
  try {
    const data = encodeFunctionData({ abi, functionName, args })
    const decoded = decodeFunctionData({ abi, data })

    const abiItem = abi.find(
      (item): item is AbiFunction => item.type === 'function' && item.name === decoded.functionName,
    )
    const inputs = abiItem?.inputs ?? []

    const decodedCalldata: DecodedCalldata = {
      functionName: decoded.functionName,
      args: (decoded.args ?? []).map((value, index) => ({
        name: inputs[index]?.name ?? `arg${index}`,
        type: inputs[index]?.type ?? 'unknown',
        value,
      })),
    }

    const argsStr = decodedCalldata.args
      .map((arg) => `  ${arg.name} (${arg.type}): ${formatArgValueFull(arg.value, arg.type)}`)
      .join('\n')

    return `${decodedCalldata.functionName}(\n${argsStr}\n)`
  } catch {
    return undefined
  }
}
