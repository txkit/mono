'use client'

import { type FormEvent, useState } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'

import type { ArbitrumChainId } from '@txkit/arbitrum-adapter'

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'
import { SequencerFeeRow } from '@/src/ui/SequencerFeeRow'


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

type ChatState = {
  messages: Message[],
  input: string,
  isLoading: boolean,
  errorMessage: string | null,
  envelope: DemoEnvelope | null,
  decodedInner: DecodedCall | null,
}

const INITIAL_STATE: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  errorMessage: null,
  envelope: null,
  decodedInner: null,
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

const resolveReplyText = (reply: string | undefined, hasEnvelope: boolean): string => {
  const hasReplyText = reply !== undefined && reply.length > 0
  if (hasReplyText) {
    return reply
  }

  if (hasEnvelope) {
    return '(envelope prepared - review below)'
  }

  return '(empty reply)'
}

/**
 * Scenario A client: Claude tool-use loop + one-click sign.
 *
 * Sends conversation history to /api/agent, which returns either a clarifying
 * reply (text only) or a signed envelope ready for review. wagmi
 * useSendTransaction signs envelope.call in one click; the Arbiscan link
 * appears once the tx hash is returned.
 */
export const PendleAgentChat = () => {
  const [ state, setState ] = useState<ChatState>(INITIAL_STATE)
  const { messages, input, isLoading, errorMessage, envelope, decodedInner } = state

  const patchState = (patch: Partial<ChatState>) => {
    setState((previous) => ({ ...previous, ...patch }))
  }

  const { address: connectedAddress, isConnected } = useAccount()
  const {
    sendTransaction,
    data: txHash,
    isPending: isSigning,
    error: sendError,
    reset: resetSendTx,
  } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const fetchDecoded = async (env: DemoEnvelope): Promise<DecodedCall | null> => {
    try {
      const { chain, inner } = env
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length === 0 || isLoading) {
      return
    }

    const userMessage: Message = { role: 'user', content: trimmed }
    const next = [ ...messages, userMessage ]
    patchState({ messages: next, input: '', isLoading: true, errorMessage: null })
    resetSendTx()

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, scenario: 'pendle', receiverAddress: connectedAddress }),
      })
      const json = (await response.json()) as AgentResponse
      const { reply, envelope: returnedEnvelope, error, hint } = json

      if (!response.ok) {
        const detail = hint !== undefined ? `${error ?? 'Agent error'} - ${hint}` : error ?? 'Agent request failed'
        patchState({ errorMessage: detail })
        return
      }

      const replyText = resolveReplyText(reply, returnedEnvelope !== undefined)
      patchState({ messages: [ ...next, { role: 'assistant', content: replyText } ] })

      if (returnedEnvelope !== undefined) {
        const decoded = await fetchDecoded(returnedEnvelope)
        patchState({ envelope: returnedEnvelope, decodedInner: decoded })
      }
    } catch (networkError) {
      patchState({ errorMessage: `Network error: ${String(networkError)}` })
    } finally {
      patchState({ isLoading: false })
    }
  }

  const handleSignTransaction = () => {
    if (envelope === null || !isConnected) {
      return
    }

    const { call, chain } = envelope
    const chainId = Number(chain.split(':')[1])
    sendTransaction({ to: call.to, data: call.data, value: BigInt(call.value), chainId })
  }

  const resolveTxButtonLabel = (): string => {
    if (isSigning) {
      return 'Sign in your wallet...'
    }

    if (isConfirming) {
      return 'Waiting for confirmation...'
    }

    if (isConfirmed) {
      return 'Confirmed - sign another?'
    }

    return 'Sign tx in wallet'
  }

  const isBusySendingTx = isSigning || isConfirming
  const envelopeChainId = envelope !== null ? Number(envelope.chain.split(':')[1]) : null

  const decodedForPreview = decodedInner !== null
    ? {
      selector: decodedInner.selector ?? undefined,
      functionName: decodedInner.functionName ?? undefined,
      args: decodedInner.args?.map((arg) => ({ name: arg.name ?? '', type: arg.type, value: arg.value })),
      source: decodedInner.source,
      clearSigning: decodedInner.clearSigning,
    }
    : undefined

  const emptyStateNode = (
    <div className="rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)]/40 px-5 py-8 text-center">
      <p className="text-sm text-[color:var(--color-muted)]">
        Try{': '}
        <span className="font-mono text-[color:var(--color-foreground)]">Swap 100 USDC for PT-stETH</span>
      </p>
      <p className="text-xs text-[color:var(--color-muted)] mt-2">
        The agent calls prepare_pendle_yield_swap, you review the decoded envelope, then sign in your wallet.
      </p>
    </div>
  )

  const messagesNode = messages.length === 0
    ? emptyStateNode
    : messages.map((message, index) => (
      <ChatMessage key={index} role={message.role} content={message.content} />
    ))

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        {messagesNode}
        {isLoading ? (
          <div className="text-sm text-[color:var(--color-muted)]">Agent thinking&hellip;</div>
        ) : null}
      </div>

      {errorMessage !== null ? (
        <div className="rounded-md border border-[color:var(--color-error)] bg-[color:var(--color-error-bg)] px-3 py-2 text-sm text-[color:var(--color-error)]">
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
          decoded={decodedForPreview}
          policyStatus="allow"
          policyReason="signed by agent, within policy gate limits"
          feeSlot={(
            <SequencerFeeRow
              chain={envelope.chain as ArbitrumChainId}
              to={envelope.call.to}
              calldata={envelope.call.data}
            />
          )}
        />
      ) : null}

      {envelope !== null ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSignTransaction}
            disabled={!isConnected || isBusySendingTx}
            className="w-full rounded-md border border-[color:var(--color-success)] bg-[color:var(--color-success-bg)] px-4 py-3 text-sm text-[color:var(--color-success)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resolveTxButtonLabel()}
          </button>
          {!isConnected ? (
            <p className="text-xs text-[color:var(--color-muted)] text-center">Connect your wallet to sign</p>
          ) : null}
          {sendError !== null ? (
            <div className="rounded-md border border-[color:var(--color-error)] bg-[color:var(--color-error-bg)] px-3 py-2 text-xs text-[color:var(--color-error)]">
              {sendError.message}
            </div>
          ) : null}
          {txHash !== undefined && envelopeChainId !== null ? (
            <a
              href={formatTxExplorerUrl(envelopeChainId, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-mono text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] underline"
            >
              {isConfirmed ? 'Confirmed on Arbiscan' : 'View pending tx on Arbiscan'}: {txHash}
            </a>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--color-accent)]"
          placeholder="Describe a yield rotation..."
          value={input}
          onChange={(event) => patchState({ input: event.target.value })}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm text-[color:var(--color-accent-text)] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  )
}
