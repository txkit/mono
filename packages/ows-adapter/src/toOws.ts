import type { EvmBatchEnvelope, EvmTxEnvelope } from '@txkit/tx-protocol'

import type { OwsSignAndSendPayload, OwsSimulationResult, OwsTransaction } from './types'


const HEX_ZERO = '0x0' as `0x${string}`

const OWS_RISK_ACTION: Record<'ALLOW' | 'WARN' | 'BLOCK', 'allow' | 'warn' | 'block'> = {
  ALLOW: 'allow',
  WARN: 'warn',
  BLOCK: 'block',
}

const callToOwsTransaction = (call: { to: `0x${string}`; data?: `0x${string}`; value?: `0x${string}` }): OwsTransaction => {
  return {
    rawHex: '0x' as `0x${string}`,
    to: call.to,
    value: call.value ?? HEX_ZERO,
    data: call.data ?? '0x',
  }
}

const buildSimulationResult = (envelope: EvmTxEnvelope | EvmBatchEnvelope): OwsSimulationResult => {
  const { content, risk } = envelope
  const { description, metadata, validity } = content

  return {
    functionName: description.short,
    counterparties: metadata.counterparties?.map((counterparty) => ({
      role: counterparty.role,
      address: counterparty.address,
      label: counterparty.label,
      labelSource: counterparty.labelSource,
    })),
    tokenMovements: metadata.tokenMovements?.map((movement) => ({
      kind: movement.kind,
      token: movement.token,
      from: movement.from,
      to: movement.to,
      amount: movement.amount,
      isUnlimited: movement.isUnlimited,
      standard: movement.standard,
      tokenId: movement.tokenId,
    })),
    risk: risk
      ? {
        action: risk.action ? OWS_RISK_ACTION[risk.action] : undefined,
        reasons: risk.warnings?.map((warning) => warning.message),
      }
      : undefined,
    validity: { notAfter: validity.notAfter },
  }
}

/**
 * Convert a PreparedEnvelope (kind 'evm-tx' or 'evm-batch') to an OWS
 * signAndSend payload with policy-engine annotations populated from the
 * envelope's content.metadata + risk fields.
 *
 * For 'signature' envelopes, use `toOwsSignMessage` instead (not yet
 * implemented in this skeleton).
 */
export const toOwsSignAndSend = (envelope: EvmTxEnvelope | EvmBatchEnvelope): OwsSignAndSendPayload => {
  const calls = envelope.content.calls
  const isBatch = calls.length >= 2
  const transaction: OwsSignAndSendPayload['transaction'] = isBatch
    ? calls.map(callToOwsTransaction)
    : callToOwsTransaction(calls[0]!)

  return {
    chain: envelope.content.chain,
    transaction,
    atomicRequired: isBatch ? envelope.capabilities?.atomicRequired : undefined,
    simulation: buildSimulationResult(envelope),
    meta: envelope.meta,
  }
}
