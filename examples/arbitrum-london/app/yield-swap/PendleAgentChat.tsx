'use client'

import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi'

import type { ArbitrumChainId } from '@txkit/arbitrum-adapter'

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { ChatShell } from '@/src/ui/ChatShell/ChatShell'
import { Collapse } from '@/src/ui/Collapse'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'
import { Icon } from '@/src/ui/Icon'
import { Note } from '@/src/ui/Note'
import { SequencerFeeRow } from '@/src/ui/SequencerFeeRow'

import { AgentReasoning } from './AgentReasoning/AgentReasoning'
import { PreparingCard } from './AgentReasoning/PreparingCard'
import { PolicyChecklist } from './PolicyChecklist/PolicyChecklist'
import { SignEnvelopeActions } from './SignEnvelopeActions'
import { fetchDecoded, type DecodedCall } from './utils/fetchDecoded'
import { formatChainLabel, formatExplorerBase, resolveReplyText, splitReasoningLines } from './utils/formatters'


type Message = { id: string, role: 'user' | 'assistant', content: string, status?: 'prepared' | 'rejected' | 'executed' }

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

/** Example prompts offered as one-click chips under the composer. */
const SUGGESTED_PROMPTS = [
  'Swap 100 USDC for PT-stETH',
  'Swap 1 WETH for PT-stETH',
  'Swap 50 USDC for PT-USDC',
]

/**
 * Pipeline stages narrated in the in-flight reasoning card. Each names a real
 * step the request goes through in /api/agent: the LLM parses the intent,
 * evaluates the prepare_pendle_yield_swap tool, the envelope builder fills
 * amounts / min-out / expiry, and the agent key signs the EIP-712 envelope.
 */
const PREPARING_STEPS = [
  'Parsing the yield-swap intent',
  'Evaluating tool call: prepare_pendle_yield_swap',
  'Building the envelope: amounts, min-out, expiry',
  'Signing as the agent (EIP-712)',
]

type PendleAgentChatProps = {
  header: ReactNode,
  intro: ReactNode,
  banner: ReactNode,
  footer: ReactNode,
}

/**
 * Scenario A client: LLM tool-use loop + one-click sign.
 *
 * Sends conversation history to /api/agent, which returns either a clarifying
 * reply (text only) or a signed envelope ready for review. wagmi
 * useSendTransaction signs envelope.call in one click; the explorer link
 * appears once the tx hash is returned. The static page chrome (header, intro,
 * deploy banner, footer) is passed in as slots so the whole page lives inside
 * the scrollable ChatShell with the composer pinned to the viewport bottom.
 */
export const PendleAgentChat = (props: PendleAgentChatProps) => {
  const { header, intro, banner, footer } = props
  const [ state, setState ] = useState<ChatState>(INITIAL_STATE)
  const { messages, input, isLoading, errorMessage, envelope, decodedInner } = state

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

  // When the tx confirms, promote the prepared turn to 'executed' so its OWN
  // reasoning card becomes the "Executed on-chain" card in place (no separate
  // success card) and that status persists in history after the next prompt.
  useEffect(() => {
    if (!isConfirmed) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the external wagmi tx-receipt confirmation into the turn status; must persist past the next prompt (which resets isConfirmed), so it cannot be a render-time derivation
    setState((previous) => {
      const lastPreparedIndex = previous.messages.map((message) => message.status).lastIndexOf('prepared')
      if (lastPreparedIndex === -1) {
        return previous
      }

      const messages = previous.messages.map((message, index) =>
        index === lastPreparedIndex ? { ...message, status: 'executed' as const } : message,
      )

      return { ...previous, messages }
    })
  }, [ isConfirmed ])

  const submitPrompt = async (rawText: string) => {
    const trimmed = rawText.trim()
    if (trimmed.length === 0 || isLoading || !isConnected) {
      return
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const next = [ ...messages, userMessage ]
    // Clear any prior envelope so a previous prepared/executed turn's review does
    // not linger while the new turn is in flight (the composer is now visible in
    // the executed state, so a new prompt can arrive on top of an old envelope).
    patchState({ messages: next, input: '', isLoading: true, errorMessage: null, envelope: null, decodedInner: null })
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
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyText,
        status: returnedEnvelope !== undefined ? 'prepared' : undefined,
      }
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

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitPrompt(input)
  }

  const handleSuggestionClick = (prompt: string) => {
    void submitPrompt(prompt)
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
    // only flag a real decline - an envelope rejected before it was signed. The
    // flag lives on the assistant turn itself (not a chat-level boolean) so the
    // decline persists in the transcript after the next message instead of
    // vanishing when the turn drops out of the live reasoning card.
    const wasDeclined = !isConfirmed
    setState((previous) => {
      const lastIndex = previous.messages.length - 1
      const shouldMark = wasDeclined && previous.messages[lastIndex]?.role === 'assistant'
      const messages = shouldMark
        ? previous.messages.map((message, index) => (index === lastIndex ? { ...message, status: 'rejected' as const } : message))
        : previous.messages

      return { ...previous, envelope: null, decodedInner: null, messages }
    })
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

  const isPrepared = envelope !== null

  // Every bot turn renders as an AgentReasoning card (its per-turn status drives
  // the subtitle + theme); user turns stay as bubbles. A turn still in flight has
  // no message yet, so the in-flight "preparing" card is appended separately
  // below the transcript.
  const turnsNode = messages.map((message) => {
    if (message.role === 'user') {
      return <ChatMessage key={message.id} role="user" content={message.content} />
    }

    return (
      <AgentReasoning
        key={message.id}
        reasoningLines={splitReasoningLines(message.content)}
        status={message.status ?? 'replied'}
      />
    )
  })

  // Show the in-flight "preparing" card only while the reply has not landed yet
  // (last turn is still the user's). Once the assistant message is added - even
  // though isLoading stays true through the decode call - its own card takes over,
  // so the preparing card and the prepared card never show at the same time.
  const isAwaitingReply = isLoading && messages[messages.length - 1]?.role !== 'assistant'
  const preparingNode = isAwaitingReply ? <PreparingCard steps={PREPARING_STEPS} /> : null

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

  // The composer is hidden only during review (prepared, not yet confirmed) -
  // there the next action is Reject or Sign, not more chatting. It returns on
  // reject AND once the tx is executed, so the user can start the next
  // transaction from the terminal "Executed on-chain" state without a refresh.
  const isComposerShown = !isPrepared || isConfirmed

  const composerNode = (
    <div className="space-y-2">
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent"
      >
        <input
          aria-label="Describe a yield rotation"
          className="flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed"
          placeholder={inputPlaceholder}
          value={input}
          onChange={(event) => patchState({ input: event.target.value })}
          disabled={isLoading || !isConnected}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={isLoading || !isConnected || input.trim().length === 0}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
        >
          <Icon name="arrow-up" className="size-4" />
        </button>
      </form>
      <div className="px-1 text-xs leading-relaxed">
        <span className="text-muted">Try: </span>
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <span key={prompt}>
            <button
              type="button"
              onClick={() => handleSuggestionClick(prompt)}
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

  // scrollKey drives ChatShell's auto-scroll-to-bottom: it changes on every
  // event that adds or swaps transcript content (new turn, in-flight reply,
  // prepared review, confirmation) so the newest block is brought into view.
  const scrollKey = `${messages.length}:${isLoading}:${isPrepared}:${isConfirmed}`

  return (
    <ChatShell header={header} composer={isComposerShown ? composerNode : null} scrollKey={scrollKey}>
      {intro}
      {banner}
      {turnsNode}
      {preparingNode}
      {errorNode}
      {reviewNode}
      {footer}
    </ChatShell>
  )
}
