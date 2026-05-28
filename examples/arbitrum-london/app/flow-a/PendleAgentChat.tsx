'use client'

import { useState, type FormEvent } from 'react'
import { useAccount } from 'wagmi'

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'


type Message = { role: 'user' | 'assistant', content: string }

type DecodedArg = { name: string | null, type: string, value: unknown }

type DecodedCall = {
  selector?: string | null,
  functionName?: string | null,
  args?: ReadonlyArray<DecodedArg>,
  source?: string,
  clearSigning?: { title?: string, fields?: Record<string, string> },
}

type AgentResponse = {
  reply?: string,
  envelope?: DemoEnvelope,
  error?: string,
  hint?: string,
}

const formatChainLabel = (chain: `eip155:${number}`): string => {
  const chainId = Number(chain.split(':')[1])
  if (chainId === 421614) {
    return 'Arbitrum Sepolia (421614)'
  }
  if (chainId === 46630) {
    return 'Robinhood Chain testnet (46630)'
  }
  return `chain ${chainId}`
}

/**
 * Day 5 client: tool-use loop. Sends conversation history to /api/agent,
 * which returns either a clarifying reply (text only) or a signed envelope
 * ready for the user to inspect via EnvelopePreview.
 *
 * Day 6 will wire TransactionButton (wagmi useSendTransaction) below the
 * preview for one-click signing.
 */
export const PendleAgentChat = () => {
  const [ messages, setMessages ] = useState<Message[]>([])
  const [ input, setInput ] = useState('')
  const [ isLoading, setLoading ] = useState(false)
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null)
  const [ envelope, setEnvelope ] = useState<DemoEnvelope | null>(null)
  const [ decodedInner, setDecodedInner ] = useState<DecodedCall | null>(null)

  const { address: connectedAddress } = useAccount()

  const fetchDecoded = async (env: DemoEnvelope): Promise<DecodedCall | null> => {
    try {
      const response = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: env.chain,
          call: {
            to: env.inner.to,
            data: env.inner.data,
            value: env.inner.value,
          },
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length === 0 || isLoading) {
      return
    }

    const userMessage: Message = { role: 'user', content: trimmed }
    const next = [ ...messages, userMessage ]
    setMessages(next)
    setInput('')
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          scenario: 'pendle',
          receiverAddress: connectedAddress,
        }),
      })
      const json = (await response.json()) as AgentResponse

      if (!response.ok) {
        const detail = json.hint !== undefined ? `${json.error ?? 'Agent error'} - ${json.hint}` : json.error ?? 'Agent request failed'
        setErrorMessage(detail)
        return
      }

      const replyText = json.reply !== undefined && json.reply.length > 0
        ? json.reply
        : json.envelope !== undefined
          ? '(envelope prepared - review below)'
          : '(empty reply)'
      setMessages([ ...next, { role: 'assistant', content: replyText } ])

      if (json.envelope !== undefined) {
        setEnvelope(json.envelope)
        const decoded = await fetchDecoded(json.envelope)
        setDecodedInner(decoded)
      }
    } catch (networkError) {
      setErrorMessage(`Network error: ${String(networkError)}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <section className="space-y-4">
      <div className="space-y-3 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="opacity-50 text-sm italic">
            Try: &ldquo;Swap 100 USDC for PT-stETH&rdquo;. Agent calls prepare_pendle_yield_swap, you review the envelope, then sign in your wallet (Day 6).
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))
        )}
        {isLoading ? (
          <div className="opacity-60 text-sm">Agent thinking&hellip;</div>
        ) : null}
      </div>

      {errorMessage !== null ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {envelope !== null ? (
        <EnvelopePreview
          chainLabel={formatChainLabel(envelope.chain)}
          toAddress={envelope.call.to}
          innerToAddress={envelope.inner.to}
          innerLabel={envelope.inner.label}
          envelopeHash={envelope.meta.envelopeHash}
          validityNotAfter={envelope.meta.validity.notAfter}
          decoded={decodedInner !== null ? {
            selector: decodedInner.selector ?? undefined,
            functionName: decodedInner.functionName ?? undefined,
            args: decodedInner.args?.map((arg) => ({
              name: arg.name ?? '',
              type: arg.type,
              value: arg.value,
            })),
            source: decodedInner.source,
            clearSigning: decodedInner.clearSigning,
          } : undefined}
          policyStatus="allow"
          policyReason="signed by agent, within policy gate limits"
        />
      ) : null}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-sm"
          placeholder="Describe a yield rotation..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  )
}
