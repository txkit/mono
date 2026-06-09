'use client'

import { type FormEvent, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'

import type { ArbitrumChainId } from '@txkit/arbitrum-adapter'

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'
import { SequencerFeeRow } from '@/src/ui/SequencerFeeRow'

import { AgentReasoning } from './AgentReasoning/AgentReasoning'
import { PolicyChecklist } from './PolicyChecklist/PolicyChecklist'
import { SignEnvelopeActions } from './SignEnvelopeActions'
import { fetchDecoded, type DecodedCall } from './utils/fetchDecoded'
import { formatChainLabel, formatExplorerBase, resolveReplyText, splitReasoningLines } from './utils/formatters'


type Message = { id: string, role: 'user' | 'assistant', content: string }

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

/**
 * Scenario A client: Claude tool-use loop + one-click sign.
 *
 * Sends conversation history to /api/agent, which returns either a clarifying
 * reply (text only) or a signed envelope ready for review. wagmi
 * useSendTransaction signs envelope.call in one click; the explorer link
 * appears once the tx hash is returned.
 */
export const PendleAgentChat = () => {
  const [ state, setState ] = useState<ChatState>(INITIAL_STATE)
  const { messages, input, isLoading, errorMessage, envelope, decodedInner } = state

  const patchState = (patch: Partial<ChatState>) => {
    setState((previous) => ({ ...previous, ...patch }))
  }

  const { address: connectedAddress, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID })
  const {
    sendTransaction,
    data: txHash,
    isPending: isSigning,
    error: sendError,
    reset: resetSendTx,
  } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length === 0 || isLoading || !isConnected) {
      return
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
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
        const baseError = error ?? 'Agent error'
        const detail = hint !== undefined ? `${baseError} - ${hint}` : baseError
        patchState({ errorMessage: detail })
        return
      }

      const replyText = resolveReplyText(reply, returnedEnvelope !== undefined)
      const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: replyText }
      patchState({ messages: [ ...next, assistantMessage ] })

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

  const handleSignTransaction = async () => {
    if (envelope === null || !isConnected) {
      return
    }

    const { call, chain } = envelope
    const chainId = Number(chain.split(':')[1])

    // Arbitrum's base fee can rise between fee estimation and submission, so a
    // tight maxFeePerGas lands just under base fee and the RPC rejects the tx
    // ("max fee per gas less than block base fee"). Read the live fee and double
    // the cap for headroom: the cap is a ceiling, not the price, so the tx still
    // pays only the prevailing base fee and the extra headroom costs nothing.
    const fees = await publicClient?.estimateFeesPerGas().catch(() => undefined)

    sendTransaction({
      to: call.to,
      data: call.data,
      value: BigInt(call.value),
      chainId,
      maxFeePerGas: fees ? fees.maxFeePerGas * 2n : undefined,
      maxPriorityFeePerGas: fees ? fees.maxPriorityFeePerGas : undefined,
    })
  }

  const handleReject = () => {
    patchState({ envelope: null, decodedInner: null })
    resetSendTx()
  }

  const isBusySendingTx = isSigning || isConfirming
  const envelopeChainId = envelope !== null ? Number(envelope.chain.split(':')[1]) : null
  const inputPlaceholder = isConnected
    ? 'Describe a yield rotation...'
    : 'Connect your wallet to start...'

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
    <div className="rounded-lg border border-dashed border-border bg-card/40 px-5 py-8 text-center">
      <p className="text-sm text-muted">
        Try{': '}
        <span className="font-mono text-foreground">Swap 100 USDC for PT-stETH</span>
      </p>
      <p className="text-xs text-muted mt-2">
        PT-stETH is a Pendle Principal Token - a fixed-yield position. The agent calls
        prepare_pendle_yield_swap, you review the decoded envelope, then sign in your wallet.
      </p>
    </div>
  )

  const latestAssistant = [ ...messages ].reverse().find((message) => message.role === 'assistant')
  const isPrepared = envelope !== null
  const reasoningLines = isPrepared && latestAssistant !== undefined
    ? splitReasoningLines(latestAssistant.content)
    : []
  const transcriptMessages = messages.filter((message) => {
    const isHoistedIntoReasoning = isPrepared && message.id === latestAssistant?.id
    return !isHoistedIntoReasoning
  })

  const messagesNode = messages.length === 0
    ? emptyStateNode
    : transcriptMessages.map((message) => (
      <ChatMessage key={message.id} role={message.role} content={message.content} />
    ))

  const reasoningNode = isLoading || isPrepared ? (
    <AgentReasoning reasoningLines={reasoningLines} isPreparing={isLoading} isPrepared={isPrepared} />
  ) : null

  const checklistNode = isPrepared ? <PolicyChecklist /> : null

  const mockNoticeNode = isPrepared ? (
    <div className="rounded-md border border-border bg-card/40 px-3 py-2 text-xs text-muted">
      <span className="font-medium text-foreground">Testnet demo - real enforcement, mock settlement.</span>{' '}
      The swap router is a mock, so no tokens move - the demo proves the verification layer, not the DEX.
      The gate checks above run on-chain, verifiable on Arbiscan.
    </div>
  ) : null

  const errorNode = errorMessage !== null ? (
    <div role="alert" className="rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
      {errorMessage}
    </div>
  ) : null

  const previewNode = envelope !== null ? (
    <EnvelopePreview
      chainLabel={formatChainLabel(envelope.chain)}
      toAddress={envelope.call.to}
      innerToAddress={envelope.inner.to}
      innerLabel={envelope.inner.label}
      envelopeHash={envelope.meta.envelopeHash}
      validityNotAfter={envelope.meta.validity.notAfter}
      decoded={decodedForPreview}
      innerData={envelope.inner.data}
      policyStatus="allow"
      policyReason="signed by agent, within policy gate limits"
      explorerBaseUrl={formatExplorerBase(envelopeChainId)}
      feeSlot={(
        <SequencerFeeRow
          chain={envelope.chain as ArbitrumChainId}
          to={envelope.call.to}
          calldata={envelope.call.data}
        />
      )}
    />
  ) : null

  const actionsNode = envelope !== null ? (
    <SignEnvelopeActions
      isConnected={isConnected}
      isSigning={isSigning}
      isConfirming={isConfirming}
      isConfirmed={isConfirmed}
      isBusySendingTx={isBusySendingTx}
      txHash={txHash}
      sendError={sendError}
      envelopeChainId={envelopeChainId}
      onReject={handleReject}
      onSign={handleSignTransaction}
    />
  ) : null

  // Once an envelope is on screen the next action is Reject or Sign, not more
  // chatting, so the composer is hidden during review and returns on reject.
  const chatFormNode = isPrepared ? null : (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        aria-label="Describe a yield rotation"
        className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
        placeholder={inputPlaceholder}
        value={input}
        onChange={(event) => patchState({ input: event.target.value })}
        disabled={isLoading || !isConnected}
      />
      <button
        type="submit"
        disabled={isLoading || !isConnected || input.trim().length === 0}
        className="rounded-md bg-accent px-4 py-2 text-sm text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
      >
        Send
      </button>
    </form>
  )

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        {messagesNode}
      </div>

      {reasoningNode}
      {errorNode}
      {previewNode}
      {checklistNode}
      {mockNoticeNode}
      {actionsNode}
      {chatFormNode}
    </section>
  )
}
