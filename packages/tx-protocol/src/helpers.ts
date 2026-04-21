import { SPEC_SCHEMA_URL, SPEC_VERSION } from './version'
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

function rfc3339Now(): string {
  return new Date().toISOString()
}

function deriveExpiresAt(content: EvmTxContent | SignatureContent, fallback?: string): string | undefined {
  if (fallback) {
    return fallback
  }
  const notAfter =
    'validity' in content && content.validity ? content.validity.notAfter : undefined
  if (typeof notAfter === 'number') {
    return new Date(notAfter * 1000).toISOString()
  }
  return undefined
}

export function createEvmTx(
  content: EvmTxContent,
  envelope: EnvelopeCommon = {},
): EvmTxEnvelope {
  return {
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
  }
}

export function createEvmBatch(
  content: EvmTxContent,
  envelope: EnvelopeCommon = {},
): EvmBatchEnvelope {
  return {
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
  }
}

export function createSignature(
  content: SignatureContent,
  envelope: EnvelopeCommon = {},
): SignatureEnvelope {
  return {
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
  }
}
