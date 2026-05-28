'use client'

import { useState, type FormEvent } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'

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

const formatTxExplorerUrl = (chainId: number, txHash: `0x${string}`): string => {
  if (chainId === 421614) {
    return `https://sepolia.arbiscan.io/tx/${txHash}`
  }
  if (chainId === 46630) {
    return `https://explorer.testnet.chain.robinhood.com/tx/${txHash}`
  }
  return `chain ${chainId} tx ${txHash}`
}

/**
 * Day 5 + Day 6 client: tool-use loop + TransactionButton.
 *
 * Day 5 sends conversation history to /api/agent, which returns either a
 * clarifying reply (text only) or a signed envelope ready for review.
 * Day 6 adds wagmi useSendTransaction so the user signs envelope.call in
 * one click. The Arbiscan link appears once the tx hash is returned.
 */
export const PendleAgentChat = () => {
  const [ messages, setMessages ] = useState<Message[]>([])
  const [ input, setInput ] = useState('')
  const [ isLoading, setLoading ] = useState(false)
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null)
  const [ envelope, setEnvelope ] = useState<DemoEnvelope | null>(null)
  const [ decodedInner, setDecodedInner ] = useState<DecodedCall | null>(null)

  const { address: connectedAddress, isConnected } = useAccount()
  const {
    sendTransaction,
    data: txHash,
    isPending: isSigning,
    error: sendError,
    reset: resetSendTx,
  } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const fetchDecoded = async (env: DemoEnvelope): Promise<DecodedCall | null> => {
    try {
      const { chain, inner } = env
      const response = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain,
          call: {
            to: inner.to,
            data: inner.data,
            value: inner.value,
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
    resetSendTx()

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
      const { reply, envelope: returnedEnvelope, error, hint } = json

      if (!response.ok) {
        const detail = hint !== undefined ? `${error ?? 'Agent error'} - ${hint}` : error ?? 'Agent request failed'
        setErrorMessage(detail)
        return
      }

      const hasReplyText = reply !== undefined && reply.length > 0
      const replyTextNode = hasReplyText
        ? reply
        : returnedEnvelope !== undefined
          ? '(envelope prepared - review below)'
          : '(empty reply)'
      setMessages([ ...next, { role: 'assistant', content: replyTextNode } ])

      if (returnedEnvelope !== undefined) {
        setEnvelope(returnedEnvelope)
        const decoded = await fetchDecoded(returnedEnvelope)
        setDecodedInner(decoded)
      }
    } catch (networkError) {
      setErrorMessage(`Network error: ${String(networkError)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignTransaction = () => {
    if (envelope === null || !isConnected) {
      return
    }
    const { call, chain } = envelope
    const chainId = Number(chain.split(':')[1])
    sendTransaction({
      to: call.to,
      data: call.data,
      value: BigInt(call.value),
      chainId,
    })
  }

  const isBusySendingTx = isSigning || isConfirming
  const envelopeChainId = envelope !== null ? Number(envelope.chain.split(':')[1]) : null
  const txButtonLabel = isSigning
    ? 'Sign in your wallet...'
    : isConfirming
      ? 'Waiting for confirmation...'
      : isConfirmed
        ? 'Confirmed - sign another?'
        : 'Sign tx in wallet'


  return (
    <section className="space-y-4">
      <div className="space-y-3 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="opacity-50 text-sm italic">
            Try: &ldquo;Swap 100 USDC for PT-stETH&rdquo;. Agent calls prepare_pendle_yield_swap, you review the envelope, then sign in your wallet.
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

      {envelope !== null ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSignTransaction}
            disabled={!isConnected || isBusySendingTx}
            className="w-full rounded-md bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-sm text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {txButtonLabel}
          </button>
          {!isConnected ? (
            <p className="text-xs opacity-60 text-center">Connect your wallet to sign</p>
          ) : null}
          {sendError !== null ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {sendError.message}
            </div>
          ) : null}
          {txHash !== undefined && envelopeChainId !== null ? (
            <a
              href={formatTxExplorerUrl(envelopeChainId, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-mono opacity-80 hover:opacity-100 underline"
            >
              {isConfirmed ? 'Confirmed on Arbiscan' : 'View pending tx on Arbiscan'}: {txHash}
            </a>
          ) : null}
        </div>
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
