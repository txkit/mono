'use client'

import { type FormEvent, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'

// ArbitrumChainId covers eip155:42161 | eip155:421614 | eip155:42170 only.
// Robinhood Chain (eip155:46630) is an Arbitrum Orbit chain but is NOT in that
// union. SequencerFeeRow calls previewSequencerFee which requires ArbitrumChainId
// and would reject a force-cast 46630. Decision: omit the fee row on Robinhood
// rather than cast an unsupported chain id. The fee row is Arbitrum-specific
// infrastructure anyway (L1 calldata posting cost vs Robinhood's own sequencer).

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'
import type { SignedPaymentBody } from '@/src/x402/facilitator'

import { AgentReasoning } from '../yield-swap/AgentReasoning/AgentReasoning'
import { PolicyChecklist } from '../yield-swap/PolicyChecklist/PolicyChecklist'
import { SignEnvelopeActions } from '../yield-swap/SignEnvelopeActions'
import { fetchDecoded, type DecodedCall } from '../yield-swap/utils/fetchDecoded'
import { formatChainLabel, formatExplorerBase, resolveReplyText, splitReasoningLines } from '../yield-swap/utils/formatters'
import { X402Paywall } from './X402Paywall'


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

/** Canonical example prompt offered as a one-click chip under the composer. */
const SUGGESTED_PROMPT = 'Buy 5 TSLA'

/**
 * Scenario C client: x402-gated Claude tool-use loop + one-click sign on
 * Robinhood Chain testnet (chainId 46630).
 *
 * Renders <X402Paywall /> until the user signs a payment authorization and the
 * server verifies it. Once unlocked, the chat mirrors PendleAgentChat: messages
 * go to /api/agent with scenario:'rwa' + the signed payment body, which the
 * server re-verifies before spending any Claude tokens.
 *
 * SequencerFeeRow is omitted: ArbitrumChainId does not include 46630 (Robinhood
 * is Arbitrum Orbit but is not one of the three canonical Arbitrum chain ids in
 * @txkit/arbitrum-adapter). Omitting is safe and honest rather than force-casting.
 */
export const RwaAgentChat = () => {
  const [ state, setState ] = useState<ChatState>(INITIAL_STATE)
  const { messages, input, isLoading, errorMessage, envelope, decodedInner } = state

  // x402 gate state - kept local; once unlocked it stays unlocked for the session.
  const [ isUnlocked, setIsUnlocked ] = useState(false)
  const [ paymentBody, setPaymentBody ] = useState<SignedPaymentBody | null>(null)

  const patchState = (patch: Partial<ChatState>) => {
    setState((previous) => ({ ...previous, ...patch }))
  }

  const { address: connectedAddress, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: ROBINHOOD_TESTNET_CHAIN_ID })
  const {
    sendTransaction,
    data: txHash,
    isPending: isSigning,
    error: sendError,
    reset: resetSendTx,
  } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const handleUnlocked = (payment: SignedPaymentBody) => {
    setPaymentBody(payment)
    setIsUnlocked(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length === 0 || isLoading || paymentBody === null || !isConnected) {
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
        body: JSON.stringify({
          messages: next,
          scenario: 'rwa',
          receiverAddress: connectedAddress,
          payment: paymentBody,
        }),
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

    // Robinhood Chain is Arbitrum Orbit and shares Arbitrum's base-fee model, so
    // a tight maxFeePerGas can land just under base fee and the RPC rejects the
    // tx. Read the live fee and double the cap for headroom: the cap is a
    // ceiling, not the price, so the tx still pays only the prevailing base fee.
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

  if (!isUnlocked) {
    return <X402Paywall onUnlocked={handleUnlocked} />
  }

  const isBusySendingTx = isSigning || isConfirming
  const envelopeChainId = envelope !== null ? Number(envelope.chain.split(':')[1]) : null
  const inputPlaceholder = isConnected
    ? 'Buy 5 TSLA...'
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
      <p className="text-xs text-muted">
        The agent calls prepare_rwa_buy, you review the decoded envelope, then sign in your wallet.
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
      The RWA router is a mock, so no tokens move - the demo proves the verification layer, not the brokerage.
      The gate checks above run on-chain, verifiable on the explorer.
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
      // SequencerFeeRow omitted: Robinhood Chain (46630) is not an ArbitrumChainId.
      // See comment at top of file.
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
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          aria-label="Describe an RWA purchase"
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
      <button
        type="button"
        onClick={() => patchState({ input: SUGGESTED_PROMPT })}
        disabled={isLoading || !isConnected}
        className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-mono text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {SUGGESTED_PROMPT}
      </button>
    </div>
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
