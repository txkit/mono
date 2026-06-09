import type { DemoEnvelope } from '@/src/agent/envelope-builder'


export type DecodedArg = { name: string | null, type: string, value: unknown }

export type DecodedCall = {
  selector?: string | null,
  functionName?: string | null,
  args?: ReadonlyArray<DecodedArg>,
  source?: string,
  clearSigning?: { title?: string, fields?: Record<string, string> },
}

/**
 * Post the envelope's inner call to /api/decode and return the decoded shape,
 * or null when the request fails or the route reports an error. The Pendle
 * preview reads this to render human-readable arguments.
 */
export const fetchDecoded = async (envelope: DemoEnvelope): Promise<DecodedCall | null> => {
  try {
    const { chain, inner } = envelope
    const response = await fetch('/api/decode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain,
        call: { to: inner.to, data: inner.data, value: inner.value },
      }),
    })
    const json = (await response.json()) as DecodedCall & { error?: string }
    if (!response.ok || json.error !== undefined) {
      return null
    }

    return json
  } catch {
    return null
  }
}
