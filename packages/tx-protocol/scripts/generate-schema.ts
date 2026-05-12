/**
 * Generates a JSON Schema (Draft 2020-12 compatible) from the zod source of truth
 * `packages/tx-protocol/src/schema.ts`, and writes it to:
 *   `app/landing/public/schemas/v0.1/envelope.json`
 *
 * The generated file is served at `https://txkit.dev/schemas/v0.1/envelope.json`,
 * which is the canonical `$schema` URL referenced by every prepared envelope per
 * the ERC submission Specification section 1.2.
 *
 * Run via:
 *   pnpm --filter @txkit/tx-protocol gen:schema
 */

import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { preparedEnvelopeSchema } from '../src/schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SCHEMA_ID = 'https://txkit.dev/schemas/v0.1/envelope.json'
const SCHEMA_TITLE = 'PreparedTransaction Envelope v0.1'
const SCHEMA_DESCRIPTION =
  'Off-chain envelope for prepared-but-not-yet-signed transactions, batches, and signature requests. ' +
  'Reference implementation for the Ethereum ERC "Prepared Transaction Envelope" specification.'

const OUTPUT_PATH = resolve(
  __dirname,
  '../../../app/landing/public/schemas/v0.1/envelope.json',
)

const jsonSchema = zodToJsonSchema(preparedEnvelopeSchema, {
  name: 'PreparedEnvelope',
  $refStrategy: 'root',
  target: 'jsonSchema2019-09',
})

const root = jsonSchema as Record<string, unknown>
const augmented = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: SCHEMA_ID,
  title: SCHEMA_TITLE,
  description: SCHEMA_DESCRIPTION,
  ...root,
}

writeFileSync(OUTPUT_PATH, JSON.stringify(augmented, null, 2) + '\n', 'utf8')

console.log(`Wrote ${OUTPUT_PATH}`)
