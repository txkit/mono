'use client'

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi'

import type { ArbitrumChainId } from '@txkit/arbitrum-adapter'

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import { safeSessionStorage } from '@/src/helpers/safeSessionStorage'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { ChatShell } from '@/src/ui/ChatShell/ChatShell'
import { useReviewScrollPin } from '@/src/ui/ChatShell/useReviewScrollPin'
import { Collapse } from '@/src/ui/Collapse'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'
import { Icon } from '@/src/ui/Icon'
import { Note } from '@/src/ui/Note'
import { SequencerFeeRow } from '@/src/ui/SequencerFeeRow'
import { useIsomorphicLayoutEffect } from '@/src/ui/useIsomorphicLayoutEffect'

import { AgentGreeting } from './AgentGreeting'
import { AgentReasoning } from './AgentReasoning/AgentReasoning'
import { PreparingCard, STEP_INTERVAL_MS } from './AgentReasoning/PreparingCard'
import { ConnectWalletPrompt } from './ConnectWalletPrompt'
import { PolicyChecklist } from './PolicyChecklist/PolicyChecklist'
import { SignEnvelopeActions } from './SignEnvelopeActions'
import { fetchDecoded, type DecodedCall } from './utils/fetchDecoded'
import {
  formatChainLabel,
  formatExplorerBase,
  formatTxExplorerUrl,
  resolveDecodedForPreview,
  resolveReplyText,
  splitReasoningLines,
} from './utils/formatters'
import { REPLY_DELAY_MS } from './utils/useReplyDelay'


type Message = {
  id: string,
  role: 'user' | 'assistant',
  content: string,
  status?: 'prepared' | 'rejected' | 'executed',
  pipelineSteps?: string[],
  isConnectPrompt?: boolean,
  isConnectResolved?: boolean,
  txHash?: `0x${string}`,
  isRestored?: boolean,
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
  isReplyTyped: boolean,
  errorMessage: string | null,
  envelope: DemoEnvelope | null,
  decodedInner: DecodedCall | null,
}

const INITIAL_STATE: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  isReplyTyped: false,
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
 * Pipeline stages narrated in the reasoning card. Each names a real step the
 * request goes through in /api/agent: the LLM parses the message, decides
 * whether the prepare_pendle_yield_swap tool is needed, the envelope builder
 * fills amounts / min-out / expiry, and the agent key signs the EIP-712
 * envelope. Step 2 is phrased as "whether" on purpose - it is true for BOTH
 * outcomes (the model may decide no tool is needed and just reply).
 */
const PREPARING_STEPS = [
  'Parsing the request',
  'Evaluating whether to call prepare_pendle_yield_swap',
  'Building the envelope: amounts, min-out, expiry',
  'Signing as the agent (EIP-712)',
]

// Steps that run regardless of the outcome. The in-flight card stages only
// these, so nothing it shows has to be taken back when the model settles on a
// plain reply; the envelope-only steps (build, sign) appear with the prepared
// turn itself.
const IN_FLIGHT_STEPS = PREPARING_STEPS.slice(0, 2)

// How long the in-flight narration needs to play out: the reply-delay beat
// before the preparing card appears, then one stagger per step. A model reply
// that lands faster is held back this long so the steps are actually read.
const MIN_NARRATION_MS = REPLY_DELAY_MS + IN_FLIGHT_STEPS.length * STEP_INTERVAL_MS

const resolveInputPlaceholder = (isReviewing: boolean): string => {
  if (isReviewing) {
    return 'Review the prepared transaction above...'
  }

  return 'Describe a yield rotation...'
}

// sessionStorage key for the transcript (chat state lives in this client
// component, which unmounts on route change - persisting it keeps the
// conversation across in-page navigation, LLM-app style).
const CHAT_STORAGE_KEY = 'txkit-chat-pendle-v1'

type PersistedChat = Pick<ChatState, 'messages' | 'envelope' | 'decodedInner'> & {
  owner?: `0x${string}`,
}

type PendleAgentChatProps = {
  header: ReactNode,
  intro: ReactNode,
  note: ReactNode,
  banner: ReactNode,
}

/**
 * Scenario A client: LLM tool-use turn + one-click sign.
 *
 * Sends conversation history to /api/agent, which returns either a clarifying
 * reply (text only) or a signed envelope ready for review. wagmi
 * useSendTransaction signs envelope.call in one click; the explorer link
 * appears once the tx hash is returned. The static page chrome (header, intro,
 * deploy banner, footer) is passed in as slots so the whole page lives inside
 * the scrollable ChatShell with the composer pinned to the viewport bottom.
 */
export const PendleAgentChat = (props: PendleAgentChatProps) => {
  const { header, intro, note, banner } = props
  const [ state, setState ] = useState<ChatState>(INITIAL_STATE)
  const { messages, input, isLoading, isReplyTyped, errorMessage, envelope, decodedInner } = state

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
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash })

  // An account switch (wallet A -> B without a disconnect event) is a session
  // change: reset the conversation synchronously during render (React's
  // adjust-state-during-render pattern), so no effect ever runs with wallet
  // A's transcript against wallet B's address - in particular the save effect
  // can never re-stamp A's messages onto owner B. The new account starts
  // clean; a disconnect -> connect cycle is handled by the wipe effect below.
  const [ sessionAddress, setSessionAddress ] = useState(connectedAddress)
  if (connectedAddress !== sessionAddress) {
    setSessionAddress(connectedAddress)
    if (connectedAddress !== undefined && sessionAddress !== undefined) {
      setState(INITIAL_STATE)
    }
  }

  // Mirrors sessionAddress for in-flight async closures: the component stays
  // mounted through an account switch or disconnect, so a reply that resolves
  // after the session changed would otherwise write the old session's turns
  // into the new session's chat. Layout effect: synced in the same commit
  // task as the reset above, before any pending fetch continuation can run.
  const sessionAddressRef = useRef(sessionAddress)
  useIsomorphicLayoutEffect(() => {
    sessionAddressRef.current = sessionAddress
  }, [ sessionAddress ])

  // The conversation belongs to one wallet session, so the transcript is
  // restored only once that wallet reconnects (owner-checked) - never on a
  // disconnected mount. A reload keeps it: wagmi settles reconnecting ->
  // connected without ever reporting a disconnect transition. Layout effect:
  // on a client-side page switch (wagmi already connected) the restore lands
  // before the first paint, so the page appears directly in its final state.
  // Hydration is per ADDRESS: switching A -> B -> A restores A's transcript.
  const hydratedAddressRef = useRef<`0x${string}` | undefined>(undefined)
  useIsomorphicLayoutEffect(() => {
    if (!isConnected || hydratedAddressRef.current === connectedAddress) {
      return
    }
    hydratedAddressRef.current = connectedAddress

    const stored = safeSessionStorage.getItem(CHAT_STORAGE_KEY)
    if (stored === null) {
      return
    }

    try {
      const restored = JSON.parse(stored) as PersistedChat
      const hasMessages = Array.isArray(restored.messages) && restored.messages.length > 0
      if (!hasMessages) {
        safeSessionStorage.removeItem(CHAT_STORAGE_KEY)
        return
      }

      // Another wallet's transcript stays in storage untouched (its owner may
      // switch back) - it is simply not restored here. The single slot is
      // overwritten anyway the moment this wallet sends its first message.
      if (restored.owner !== connectedAddress) {
        return
      }

      // isRestored marks each turn as history, so it renders its text at once
      // instead of replaying the typing animation. A restored open review was
      // already typed in its original session, so isReplyTyped comes back true.

      setState((previous) => ({
        ...previous,
        messages: restored.messages.map((message) => ({ ...message, isRestored: true })),
        envelope: restored.envelope || null,
        decodedInner: restored.decodedInner || null,
        isReplyTyped: Boolean(restored.envelope),
      }))
    } catch {
      safeSessionStorage.removeItem(CHAT_STORAGE_KEY)
    }
  }, [ isConnected, connectedAddress ])

  // A live disconnect ends the chat session: wipe the transcript and its
  // storage so the next wallet starts clean.
  const wasConnectedRef = useRef(false)
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true
      return
    }
    if (!wasConnectedRef.current) {
      return
    }

    wasConnectedRef.current = false
    hydratedAddressRef.current = undefined
    safeSessionStorage.removeItem(CHAT_STORAGE_KEY)
    resetSendTx()
    setState(INITIAL_STATE)
  }, [ isConnected, resetSendTx ])

  // Persist the transcript on every change. The envelope (the open review) is
  // saved only while the last turn is still 'prepared' - restoring it after the
  // tx settled would re-open a review for an executed/rejected transaction.
  useEffect(() => {
    if (messages.length === 0) {
      return
    }

    const lastStatus = messages[messages.length - 1]?.status
    const isReviewOpen = lastStatus === 'prepared'
    const persisted: PersistedChat = {
      owner: connectedAddress,
      messages,
      envelope: isReviewOpen ? envelope : null,
      decodedInner: isReviewOpen ? decodedInner : null,
    }
    safeSessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(persisted))
  }, [ messages, envelope, decodedInner, connectedAddress ])

  // When the tx confirms, promote the prepared turn to 'executed' (with its tx
  // hash, so the turn keeps its own explorer link) - the SAME reasoning card
  // greens in place, and that status persists in history after the next prompt.
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
        index === lastPreparedIndex ? { ...message, status: 'executed' as const, txHash } : message,
      )

      return { ...previous, messages }
    })
  }, [ isConfirmed, txHash ])

  const sendToAgent = async (next: Message[]) => {
    // The session this request belongs to: every write below goes through
    // patchSessionState, so a continuation that resumes after an account
    // switch or disconnect drops its writes instead of leaking them.
    const requestAddress = sessionAddress
    const patchSessionState = (patch: Partial<ChatState>) => {
      if (sessionAddressRef.current !== requestAddress) {
        return
      }
      patchState(patch)
    }

    // Clear any prior envelope so a previous prepared/executed turn's review does
    // not linger while the new turn is in flight (the composer is now visible in
    // the executed state, so a new prompt can arrive on top of an old envelope).
    patchSessionState({ messages: next, input: '', isLoading: true, isReplyTyped: false, errorMessage: null, envelope: null, decodedInner: null })
    resetSendTx()
    // Started alongside the request, so the narration hold overlaps the
    // round-trip instead of adding to it. Never rejects.
    const minNarrationDelay = new Promise((resolve) => setTimeout(resolve, MIN_NARRATION_MS))

    try {
      // Connect-prompt turns are local UI artifacts - the model never sees
      // them (a mid-history "please connect wallet" could derail it).
      const modelMessages = next.filter((message) => !message.isConnectPrompt)
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: modelMessages, scenario: 'pendle', receiverAddress: connectedAddress }),
      })
      const json = (await response.json()) as AgentResponse
      const { reply, envelope: returnedEnvelope, error, hint } = json

      if (!response.ok) {
        const baseError = error ?? 'Agent error'
        const detail = hint !== undefined ? `${baseError} - ${hint}` : baseError
        patchSessionState({ errorMessage: detail })
        return
      }

      // Hold a fast reply until the in-flight narration has played out; a
      // sub-second model response would otherwise replace the preparing card
      // before a single step is read. Errors above skip the hold.
      await minNarrationDelay

      const replyText = resolveReplyText(reply, returnedEnvelope !== undefined)
      // The pipeline trace persists on the turn (LLM-style: nothing shown ever
      // disappears). A plain reply keeps just the outcome-independent stages -
      // the model evaluated whether to call the tool and decided not to, so
      // nothing was built or signed.
      const hasEnvelope = returnedEnvelope !== undefined
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyText,
        status: hasEnvelope ? 'prepared' : undefined,
        pipelineSteps: hasEnvelope ? PREPARING_STEPS : IN_FLIGHT_STEPS,
      }
      patchSessionState({ messages: [ ...next, assistantMessage ] })

      if (returnedEnvelope !== undefined) {
        const decoded = await fetchDecoded(returnedEnvelope)
        patchSessionState({ envelope: returnedEnvelope, decodedInner: decoded })
      }
    } catch (networkError) {
      patchSessionState({ errorMessage: `Network error: ${String(networkError)}` })
    } finally {
      patchSessionState({ isLoading: false })
    }
  }

  const submitPrompt = async (rawText: string) => {
    const trimmed = rawText.trim()
    if (trimmed.length === 0 || isLoading) {
      return
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }

    // No wallet - no receiver for the envelope, so the agent run would be
    // pointless. Instead of locking the composer, answer locally with a
    // connect-wallet turn (no API call, no token spend) and keep the chat open.
    if (!isConnected) {
      const connectPrompt: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Please connect wallet to continue.',
        isConnectPrompt: true,
      }
      patchState({ messages: [ ...messages, userMessage, connectPrompt ], input: '' })
      return
    }

    await sendToAgent([ ...messages, userMessage ])
  }

  // When the user connects in response to a connect-prompt turn, the chat
  // resumes by itself: the prompt card resolves in place ("Wallet connected /
  // Thanks for connecting.") and the pending request goes to the agent without
  // re-typing. The resolved flag makes this one-shot - the effect re-runs on
  // every message change, but only an unresolved trailing prompt triggers it.
  useEffect(() => {
    if (!isConnected || isLoading) {
      return
    }

    const lastMessage = messages[messages.length - 1]
    const pendingMessage = messages[messages.length - 2]
    const isAwaitingConnect = Boolean(lastMessage?.isConnectPrompt) && lastMessage?.isConnectResolved !== true
    if (!isAwaitingConnect || pendingMessage?.role !== 'user') {
      return
    }

    const resolved = messages.map((message, index) =>
      index === messages.length - 1 ? { ...message, isConnectResolved: true } : message,
    )

    void sendToAgent(resolved)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sendToAgent is an unstable closure; the guard above makes the effect idempotent, so reacting to connection + transcript changes is sufficient
  }, [ isConnected, isLoading, messages ])

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitPrompt(input)
  }

  const handleSuggestionClick = (prompt: string) => {
    void submitPrompt(prompt)
  }

  const handleReplyTyped = () => {
    patchState({ isReplyTyped: true })
  }

  // wagmi's isPending flips only after sendTransaction is reached, so during
  // the awaits below (chain switch + fee estimation) the Sign button is still
  // enabled - this ref closes that double-click window (two wallet popups).
  const isSignPendingRef = useRef(false)

  const handleSignTransaction = async () => {
    if (envelope === null || !isConnected || isSignPendingRef.current) {
      return
    }
    isSignPendingRef.current = true
    const requestAddress = sessionAddress

    try {
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
          if (sessionAddressRef.current === requestAddress) {
            patchState({ errorMessage: `Switch your wallet to ${formatChainLabel(chain)} to sign this transaction.` })
          }
          return
        }
      }

      // Arbitrum's base fee can rise between fee estimation and submission, so a
      // tight maxFeePerGas lands just under base fee and the RPC rejects the tx
      // ("max fee per gas less than block base fee"). Read the live fee and double
      // the cap for headroom: the cap is a ceiling, not the price, so the tx still
      // pays only the prevailing base fee and the extra headroom costs nothing.
      const fees = await publicClient?.estimateFeesPerGas().catch(() => undefined)

      // Wallet prompts sat open across the awaits above: if the account
      // switched meanwhile, this envelope belongs to the previous session -
      // never prompt the new account to sign it.
      if (sessionAddressRef.current !== requestAddress) {
        return
      }

      sendTransaction({
        to: call.to,
        data: call.data,
        value: BigInt(call.value),
        chainId,
        maxFeePerGas: fees ? fees.maxFeePerGas * 2n : undefined,
        maxPriorityFeePerGas: fees ? fees.maxPriorityFeePerGas : undefined,
      })
    } finally {
      isSignPendingRef.current = false
    }
  }

  const handleReject = () => {
    // Flipping the turn to 'rejected' is what closes the review (the Collapse
    // exit animates it out); the envelope itself is NOT cleared here - the
    // content must stay mounted through the exit transition, and the next
    // prompt clears it anyway. The flag lives on the assistant turn itself so
    // the decline persists in the transcript after the next message.
    const wasDeclined = !isConfirmed
    setState((previous) => {
      const lastIndex = previous.messages.length - 1
      const shouldMark = wasDeclined && previous.messages[lastIndex]?.role === 'assistant'
      const messages = shouldMark
        ? previous.messages.map((message, index) => (index === lastIndex ? { ...message, status: 'rejected' as const } : message))
        : previous.messages

      return { ...previous, messages }
    })
    resetSendTx()
  }

  const envelopeChainId = envelope !== null ? Number(envelope.chain.split(':')[1]) : null
  const decodedForPreview = resolveDecodedForPreview(decodedInner)

  const isPrepared = envelope !== null

  // Every bot turn renders as an AgentReasoning card (its per-turn status drives
  // the subtitle + theme); user turns stay as bubbles. A turn still in flight has
  // no message yet, so the in-flight "preparing" card is appended separately
  // below the transcript.
  const turnsNode = messages.map((message) => {
    if (message.role === 'user') {
      return <ChatMessage key={message.id} role="user" content={message.content} />
    }
    if (message.isConnectPrompt) {
      return <ConnectWalletPrompt key={message.id} isResolved={message.isConnectResolved} />
    }

    // An executed turn carries its own tx hash, so the card voices the outcome
    // ("Transaction submitted: ..." + explorer link) inside the same message.
    const executedTx = message.status === 'executed' && message.txHash !== undefined
      ? {
        hash: message.txHash,
        href: formatTxExplorerUrl(ARBITRUM_SEPOLIA_CHAIN_ID, message.txHash),
      }
      : undefined

    // Only the live prepared turn reports typing completion - that is what
    // gates the envelope review expanding below it.
    const onTypedComplete = message.status === 'prepared' && !message.isRestored ? handleReplyTyped : undefined

    return (
      <AgentReasoning
        key={message.id}
        reasoningLines={splitReasoningLines(message.content)}
        status={message.status ?? 'replied'}
        pipelineSteps={message.pipelineSteps}
        executedTx={executedTx}
        isInstant={message.isRestored}
        onTypedComplete={onTypedComplete}
      />
    )
  })

  // Show the in-flight "preparing" card only while the reply has not landed yet
  // (last turn is still the user's). Once the assistant message is added - even
  // though isLoading stays true through the decode call - its own card takes over,
  // so the preparing card and the prepared card never show at the same time.
  const isAwaitingReply = isLoading && messages[messages.length - 1]?.role !== 'assistant'
  const preparingNode = isAwaitingReply ? <PreparingCard steps={IN_FLIGHT_STEPS} /> : null

  const checklistNode = isPrepared ? <PolicyChecklist /> : null

  const mockNoticeNode = isPrepared ? (
    <Note icon="info">
      <span className="font-medium text-foreground">Testnet demo - real enforcement, mock settlement.</span>{' '}
      The swap router is a mock, so no tokens move - the demo proves the verification layer, not the
      DEX; the production envelope shape matches Pendle V2. The gate checks above run on-chain,
      verifiable on Arbiscan.
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
      policyReason="pre-flight check - enforced on-chain at execution"
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
      sendError={sendError || receiptError}
      onReject={handleReject}
      onSign={handleSignTransaction}
    />
  ) : null

  // The review belongs to the last turn only while it is still 'prepared': a
  // reject or confirmation flips the turn status, which closes the review (the
  // envelope itself lingers until the next prompt so the Collapse exit can
  // animate with its content mounted). It opens only after the reply finished
  // typing, so the user reads the agent's summary before the envelope appears.
  const lastMessage = messages[messages.length - 1]
  const isReviewing = isPrepared && !isConfirmed && lastMessage?.status === 'prepared'
  // A review restored from storage must appear settled: the Collapse mounts
  // already expanded and the scroll pin lands in one pre-paint jump.
  const isReviewRestored = lastMessage?.isRestored === true
  const isReviewOpen = isReviewing && isReplyTyped
  const isComposerDisabled = isLoading || isReviewing
  const inputPlaceholder = resolveInputPlaceholder(isReviewing)

  // Once the review opens, align the prepared turn card to the top of the
  // transcript so the agent's summary reads first and the envelope review
  // fills the viewport below it (instead of the default scroll-to-bottom).
  useReviewScrollPin(isReviewOpen, isReviewRestored)

  const composerNode = (
    <div className="space-y-2">
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent"
      >
        <input
          aria-label="Describe a yield rotation"
          className="flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={inputPlaceholder}
          value={input}
          onChange={(event) => patchState({ input: event.target.value })}
          disabled={isComposerDisabled}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={isComposerDisabled || input.trim().length === 0}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
        >
          <Icon name="corner-down-left" className="size-4" />
        </button>
      </form>
      <div className={`px-1 text-xs leading-relaxed ${isComposerDisabled ? 'opacity-50' : ''}`}>
        <span className="text-muted">Try: </span>
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <span key={prompt}>
            <button
              type="button"
              onClick={() => handleSuggestionClick(prompt)}
              disabled={isComposerDisabled}
              className="border-b border-dashed border-border pb-px font-mono text-muted transition-colors enabled:hover:border-accent enabled:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
            {index < SUGGESTED_PROMPTS.length - 1 ? <span className="mr-2 text-muted">,</span> : null}
          </span>
        ))}
      </div>
    </div>
  )

  // The whole review block expands in together once the prepared reply is
  // typed, and collapses out the same way on reject / confirmation - the
  // executed turn card carries the outcome line + explorer link itself.
  const reviewNode = isPrepared ? (
    <Collapse isOpen={isReviewOpen} isInstant={isReviewRestored}>
      <div className="space-y-4">
        {previewNode}
        {checklistNode}
        {mockNoticeNode}
        {actionsNode}
      </div>
    </Collapse>
  ) : null

  // scrollKey drives ChatShell's auto-scroll-to-bottom on new turns and the
  // in-flight reply; the prepared review does NOT bottom-scroll - it gets the
  // align-to-top treatment above instead.
  const scrollKey = `${messages.length}:${isLoading}`

  // The agent speaks first (entrance rules live in AgentGreeting). Synthetic:
  // not in `messages`, so it is never persisted or sent to the API.
  const greetingNode = (
    <AgentGreeting greetingId="pendle" isInstant={messages.length > 0}>
      Hi - I prepare Pendle yield swaps on Arbitrum Sepolia. Tell me what to
      rotate, or tap a suggestion below.
    </AgentGreeting>
  )

  return (
    <ChatShell
      header={header}
      pinned={(
        <>
          {intro}
          {banner}
        </>
      )}
      composer={composerNode}
      scrollKey={scrollKey}
      isFollowing={isAwaitingReply}
    >
      {note}
      {greetingNode}
      {turnsNode}
      {preparingNode}
      {errorNode}
      {reviewNode}
    </ChatShell>
  )
}
