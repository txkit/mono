import { SPEC_SCHEMA_URL, SPEC_VERSION } from './types'
import type {
  EvmBatchEnvelope,
  EvmTxContent,
  EvmTxEnvelope,
  SignatureContent,
  SignatureEnvelope,
} from './types'

type EnvelopeCommon = {
  id?: EvmTxEnvelope['id']
  issuedAt?: EvmTxEnvelope['issuedAt']
  expiresAt?: EvmTxEnvelope['expiresAt']
  nonce?: EvmTxEnvelope['nonce']
  producer?: EvmTxEnvelope['producer']
  origin?: EvmTxEnvelope['origin']
  capabilities?: EvmTxEnvelope['capabilities']
  meta?: EvmTxEnvelope['meta']
}

const rfc3339Now = (): string => new Date().toISOString()

const deriveExpiresAt = (
  content: EvmTxContent | SignatureContent,
  fallback?: string,
): string | undefined => {
  if (fallback) {
    return fallback
  }
  const notAfter = 'validity' in content ? content.validity?.notAfter : undefined
  if (typeof notAfter === 'number') {
    return new Date(notAfter * 1000).toISOString()
  }
  return undefined
}

export const createEvmTx = (
  content: EvmTxContent,
  envelope: EnvelopeCommon = {},
): EvmTxEnvelope => ({
  $schema: SPEC_SCHEMA_URL,
  version: SPEC_VERSION,
  kind: 'evm-tx',
  id: envelope.id,
  issuedAt: envelope.issuedAt ?? rfc3339Now(),
  expiresAt: deriveExpiresAt(content, envelope.expiresAt),
  nonce: envelope.nonce,
  producer: envelope.producer,
  origin: envelope.origin,
  content,
  capabilities: envelope.capabilities,
  meta: envelope.meta,
})

export const createEvmBatch = (
  content: EvmTxContent,
  envelope: EnvelopeCommon = {},
): EvmBatchEnvelope => ({
  $schema: SPEC_SCHEMA_URL,
  version: SPEC_VERSION,
  kind: 'evm-batch',
  id: envelope.id,
  issuedAt: envelope.issuedAt ?? rfc3339Now(),
  expiresAt: deriveExpiresAt(content, envelope.expiresAt),
  nonce: envelope.nonce,
  producer: envelope.producer,
  origin: envelope.origin,
  content,
  capabilities: envelope.capabilities,
  meta: envelope.meta,
})

export const createSignature = (
  content: SignatureContent,
  envelope: EnvelopeCommon = {},
): SignatureEnvelope => ({
  $schema: SPEC_SCHEMA_URL,
  version: SPEC_VERSION,
  kind: 'signature',
  id: envelope.id,
  issuedAt: envelope.issuedAt ?? rfc3339Now(),
  expiresAt: deriveExpiresAt(content, envelope.expiresAt),
  nonce: envelope.nonce,
  producer: envelope.producer,
  origin: envelope.origin,
  content,
  capabilities: envelope.capabilities,
  meta: envelope.meta,
})
