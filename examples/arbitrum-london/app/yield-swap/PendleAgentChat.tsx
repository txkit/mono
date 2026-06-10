'use client'

import { type FormEvent, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi'

import type { ArbitrumChainId } from '@txkit/arbitrum-adapter'

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { Collapse } from '@/src/ui/Collapse'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'
import { Note } from '@/src/ui/Note'
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
  isRejected: boolean,
}

const INITIAL_STATE: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  errorMessage: null,
  envelope: null,
  decodedInner: null,
  isRejected: false,
}

/** Example prompts offered as one-click chips under the composer. */
const SUGGESTED_PROMPTS = [
  'Swap 100 USDC for PT-stETH',
  'Swap 1 WETH for PT-stETH',
  'Swap 50 USDC for PT-USDC',
]

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
  const { messages, input, isLoading, errorMessage, envelope, decodedInner, isRejected } = state

  const patchState = (patch: Partial<ChatState>) => {
    setState((previous) => ({ ...previous, ...patch }))
  }

  const { address: connectedAddress, isConnected, chainId: walletChainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
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
    patchState({ messages: next, input: '', isLoading: true, errorMessage: null, isRejected: false })
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

    // wagmi's sendTransaction does NOT auto-switch the wallet - it throws a chain
    // mismatch if the wallet sits on another chain (e.g. 46630 left over from the
    // RWA demo). Switch to the envelope's chain first, then sign.
    patchState({ errorMessage: null })
    if (walletChainId !== chainId) {
      try {
        await switchChainAsync({ chainId })
      } catch {
        patchState({ errorMessage: `Switch your wallet to ${formatChainLabel(chain)} to sign this transaction.` })
        return
      }
    }

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
    // isConfirmed reuses this handler as a post-sign reset ("sign another?"), so
    // only flag a real decline - an envelope rejected before it was signed.
    patchState({ envelope: null, decodedInner: null, isRejected: !isConfirmed })
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

  // Persistent flow intro (does not vanish after the first message): explains
  // PT-stETH + the prepare -> review -> sign loop as a Note, not a dashed box.
  const introNode = (
    <Note icon="brain">
      PT-stETH is a Pendle Principal Token - a fixed-yield position. The agent
      calls <code className="rounded bg-card-sunken px-1 font-mono text-foreground">prepare_pendle_yield_swap</code>,
      you review the decoded envelope, then sign in your wallet.
    </Note>
  )

  const isPrepared = envelope !== null
  const lastMessage = messages[messages.length - 1]
  // The agent turn is "active" (hoisted into the reasoning card) only while it
  // is the last message - i.e. the agent just replied / prepared / was rejected.
  // Once the user sends a new message the previous turn drops into the transcript
  // as history instead of lingering as a stale card.
  const activeAssistant = lastMessage?.role === 'assistant' ? lastMessage : undefined
  const reasoningLines = activeAssistant !== undefined
    ? splitReasoningLines(activeAssistant.content)
    : []
  const transcriptMessages = messages.filter((message) => message.id !== activeAssistant?.id)

  const messagesNode = transcriptMessages.length > 0 ? (
    <div className="space-y-3">
      {transcriptMessages.map((message) => (
        <ChatMessage key={message.id} role={message.role} content={message.content} />
      ))}
    </div>
  ) : null

  const reasoningNode = isLoading || activeAssistant !== undefined ? (
    <AgentReasoning reasoningLines={reasoningLines} isPreparing={isLoading} isPrepared={isPrepared} isRejected={isRejected} />
  ) : null

  const checklistNode = isPrepared ? <PolicyChecklist /> : null

  const mockNoticeNode = isPrepared ? (
    <Note icon="info">
      <span className="font-medium text-foreground">Testnet demo - real enforcement, mock settlement.</span>{' '}
      The swap router is a mock, so no tokens move - the demo proves the verification layer, not the DEX.
      The gate checks above run on-chain, verifiable on Arbiscan.
    </Note>
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
    <div className="space-y-2">
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
      <div className="text-xs leading-relaxed">
        <span className="text-muted">Try: </span>
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <span key={prompt}>
            <button
              type="button"
              onClick={() => patchState({ input: prompt })}
              disabled={isLoading || !isConnected}
              className="border-b border-dashed border-border pb-px font-mono text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
            {index < SUGGESTED_PROMPTS.length - 1 ? <span className="mr-2 text-muted">,</span> : null}
          </span>
        ))}
      </div>
    </div>
  )

  // Before signing: the full envelope review. Once the tx is confirmed the
  // review is done, so the preview/checklist/notice drop away and only the
  // success card + continue actions remain.
  const reviewDetailsNode = isConfirmed ? null : (
    <>
      {previewNode}
      {checklistNode}
      {mockNoticeNode}
    </>
  )

  // The whole review block expands in together once the agent prepares a tx.
  const reviewNode = isPrepared ? (
    <Collapse>
      <div className="space-y-4">
        {reviewDetailsNode}
        {actionsNode}
      </div>
    </Collapse>
  ) : null

  return (
    <section className="space-y-4">
      {introNode}
      {messagesNode}
      {reasoningNode}
      {errorNode}
      {reviewNode}
      {chatFormNode}
    </section>
  )
}
