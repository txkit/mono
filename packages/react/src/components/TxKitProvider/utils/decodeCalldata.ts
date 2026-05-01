import { encodeFunctionData, decodeFunctionData } from 'viem'

import type { DecodedCalldata } from '@txkit/core'

import type { TxParams, ContractTransactionProps } from '../../../types/transaction'


export const isContractCall = (tx: TxParams): tx is ContractTransactionProps => 'abi' in tx

export const decodeCalldata = (tx: TxParams): DecodedCalldata | undefined => {
  if (!isContractCall(tx)) {
    return undefined
  }
  try {
    const data = encodeFunctionData({
      abi: tx.abi,
      functionName: tx.functionName,
      args: tx.args ?? [],
    })
    const decoded = decodeFunctionData({ abi: tx.abi, data })
    const abiItem = tx.abi.find(
      (item) => 'name' in item && item.name === decoded.functionName,
    )
    const inputs = abiItem && 'inputs' in abiItem ? abiItem.inputs ?? [] : []

    return {
      functionName: decoded.functionName,
      args: (decoded.args ?? []).map((value, index) => ({
        name: inputs[index]?.name ?? `arg${index}`,
        type: inputs[index]?.type ?? 'unknown',
        value,
      })),
    }
  }
  catch {
    return undefined
  }
}
