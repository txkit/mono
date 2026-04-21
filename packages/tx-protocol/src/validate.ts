import { preparedTransactionSchema } from './schema'
import type { PreparedTransaction, ValidationResult } from './types'

export function validatePreparedTx(input: unknown): ValidationResult<PreparedTransaction> {
  const result = preparedTransactionSchema.safeParse(input)

  if (result.success) {
    return { ok: true, value: result.data as PreparedTransaction }
  }

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))

  const primary = issues[0]
  const error = primary ? `${primary.path || 'root'}: ${primary.message}` : 'invalid PreparedTransaction'

  return { ok: false, error, issues }
}
