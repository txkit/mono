'use client'

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi'

// ArbitrumChainId covers eip155:42161 | eip155:421614 | eip155:42170 only.
// Robinhood Chain (eip155:46630) is an Arbitrum Orbit chain but is NOT in that
// union. SequencerFeeRow calls previewSequencerFee which requires ArbitrumChainId
// and would reject a force-cast 46630. Decision: omit the fee row on Robinhood
// rather than cast an unsupported chain id. The fee row is Arbitrum-specific
// infrastructure anyway (L1 calldata posting cost vs Robinhood's own sequencer).

import type { DemoEnvelope } from '@/src/agent/envelope-builder'
import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import { safeSessionStorage } from '@/src/helpers/safeSessionStorage'
import { ChatMessage } from '@/src/ui/ChatMessage'
import { ChatShell } from '@/src/ui/ChatShell/ChatShell'
import { useReviewScrollPin } from '@/src/ui/ChatShell/useReviewScrollPin'
import { Collapse } from '@/src/ui/Collapse'
import { EnvelopePreview } from '@/src/ui/EnvelopePreview'
import { Icon } from '@/src/ui/Icon'
import { Note } from '@/src/ui/Note'
import { useIsomorphicLayoutEffect } from '@/src/ui/useIsomorphicLayoutEffect'
import type { SignedPaymentBody } from '@/src/x402/facilitator'

import { AgentGreeting } from '../yield-swap/AgentGreeting'
import { AgentReasoning } from '../yield-swap/AgentReasoning/AgentReasoning'
import { PreparingCard, STEP_INTERVAL_MS } from '../yield-swap/AgentReasoning/PreparingCard'
import { ConnectWalletPrompt } from '../yield-swap/ConnectWalletPrompt'
import { PolicyChecklist } from '../yield-swap/PolicyChecklist/PolicyChecklist'
import { SignEnvelopeActions } from '../yield-swap/SignEnvelopeActions'
import { fetchDecoded, type DecodedCall } from '../yield-swap/utils/fetchDecoded'
import {
  formatChainLabel,
  formatExplorerBase,
  formatTxExplorerUrl,
  resolveDecodedForPreview,
  resolveReplyText,
  splitReasoningLines,
} from '../yield-swap/utils/formatters'
import { REPLY_DELAY_MS } from '../yield-swap/utils/useReplyDelay'
import { X402Paywall } from './X402Paywall'


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
  'Buy 5 TSLA',
  'Buy 3 AMZN',
  'Buy 10 PLTR',
]

/**
 * Pipeline stages narrated in the reasoning card. Each names a real step the
 * request goes through in /api/agent: the server re-verifies the x402 payment
 * before spending LLM tokens, the LLM parses the message and decides whether
 * the prepare_rwa_buy tool is needed, and the agent key signs the EIP-712
 * envelope. Step 3 is phrased as "whether" on purpose - it is true for BOTH
 * outcomes (the model may decide no tool is needed and just reply).
 */
const PREPARING_STEPS = [
  'Re-verifying the x402 payment',
  'Parsing the request',
  'Evaluating whether to call prepare_rwa_buy',
  'Signing as the agent (EIP-712)',
]

// Steps that run regardless of the outcome. The in-flight card stages only
// these, so nothing it shows has to be taken back when the model settles on a
// plain reply; the envelope-only signing step appears with the prepared turn.
const IN_FLIGHT_STEPS = PREPARING_STEPS.slice(0, 3)

// How long the in-flight narration needs to play out: the reply-delay beat
// before the preparing card appears, then one stagger per step. A model reply
// that lands faster is held back this long so the steps are actually read.
const MIN_NARRATION_MS = REPLY_DELAY_MS + IN_FLIGHT_STEPS.length * STEP_INTERVAL_MS

const resolveInputPlaceholder = (isReviewing: boolean, isLocked: boolean): string => {
  if (isLocked) {
    return 'Pay and unlock to start...'
  }
  if (isReviewing) {
    return 'Review the prepared transaction above...'
  }

  return 'Buy a tokenised stock...'
}

// sessionStorage key for a still-valid x402 unlock (avoids re-pay on
// reload/nav). The receipt is wallet-bound: it restores only when the wallet
// that paid (payer) reconnects. v2: the challenge amount was re-denominated
// (abstract units -> 0.001 ETH in wei), so a v1 proof signed for the old
// amount fails re-verification - the version bump invalidates stale unlocks.
const X402_STORAGE_KEY = 'txkit-x402-payment-v2'

// sessionStorage key for the transcript (chat state lives in this client
// component, which unmounts on route change - persisting it keeps the
// conversation across in-page navigation, LLM-app style).
const CHAT_STORAGE_KEY = 'txkit-chat-rwa-v1'

type PersistedChat = Pick<ChatState, 'messages' | 'envelope' | 'decodedInner'> & {
  owner?: `0x${string}`,
}

type RwaAgentChatProps = {
  header: ReactNode,
  intro: ReactNode,
  note: ReactNode,
  banner: ReactNode,
}

/**
 * Scenario C client: x402-gated LLM tool-use turn + one-click sign on
 * Robinhood Chain testnet (chainId 46630).
 *
 * Renders <X402Paywall /> until the user signs a payment authorization and the
 * server verifies it. Once unlocked, the chat mirrors PendleAgentChat: messages
 * go to /api/agent with scenario:'rwa' + the signed payment body, which the
 * server re-verifies before spending any LLM tokens.
 *
 * SequencerFeeRow is omitted: ArbitrumChainId does not include 46630 (Robinhood
 * is Arbitrum Orbit but is not one of the three canonical Arbitrum chain ids in
 * @txkit/arbitrum-adapter). Omitting is safe and honest rather than force-casting.
 *
 * The static page chrome (header, intro, deploy banner, footer) is passed in as
 * slots so the whole page - paywall included - lives inside the scrollable
 * ChatShell with the composer pinned to the viewport bottom.
 */
export const RwaAgentChat = (props: RwaAgentChatProps) => {
  const { header, intro, note, banner } = props
  const [ state, setState ] = useState<ChatState>(INITIAL_STATE)
  const { messages, input, isLoading, isReplyTyped, errorMessage, envelope, decodedInner } = state

  // x402 gate state - kept local; once unlocked it stays unlocked for the session.
  const [ paymentBody, setPaymentBody ] = useState<SignedPaymentBody | null>(null)
  const isUnlocked = paymentBody !== null

  const patchState = (patch: Partial<ChatState>) => {
    setState((previous) => ({ ...previous, ...patch }))
  }

  const { address: connectedAddress, isConnected, chainId: walletChainId, status: accountStatus } = useAccount()

  // Probe sessionStorage once on mount: when a still-valid receipt is present
  // the paywall is NOT flashed while wagmi settles - the locked slot stays
  // blank until the connection resolves (and restores the unlock) or settles
  // disconnected (then the paywall is honest).
  const [ unlockProbe, setUnlockProbe ] = useState<'pending' | 'stored' | 'none'>('pending')
  useEffect(() => {
    const stored = safeSessionStorage.getItem(X402_STORAGE_KEY)
    let hasValidStored = false
    if (stored !== null) {
      try {
        const restored = JSON.parse(stored) as SignedPaymentBody
        hasValidStored = restored.validUntil * 1000 > Date.now()
      } catch {
        hasValidStored = false
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only storage probe on mount
    setUnlockProbe(hasValidStored ? 'stored' : 'none')
  }, [])

  // Hard cap on how long the paywall is held back: wagmi can sit in
  // 'connecting' indefinitely (e.g. a stale stored connection with a locked
  // wallet extension), so "settled" cannot be detected from status alone. If
  // the unlock has not restored within the window, the paywall shows anyway.
  const [ hasUnlockWaitExpired, setUnlockWaitExpired ] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => setUnlockWaitExpired(true), 3000)

    return () => clearTimeout(timeout)
  }, [])
  const { switchChainAsync } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: ROBINHOOD_TESTNET_CHAIN_ID })
  const {
    sendTransaction,
    data: txHash,
    isPending: isSigning,
    error: sendError,
    reset: resetSendTx,
  } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash })

  // An account switch (wallet A -> B without a disconnect event) is a session
  // change: reset the conversation AND the x402 unlock synchronously during
  // render (React's adjust-state-during-render pattern), so no effect ever
  // runs with wallet A's transcript or receipt against wallet B's address -
  // the save effect cannot re-stamp A's messages onto owner B, and B never
  // sees A's unlocked agent ("Payment verified" belongs to the payer only).
  // The new account starts at the paywall; a disconnect -> connect cycle is
  // handled by the wipe effect below.
  const [ sessionAddress, setSessionAddress ] = useState(connectedAddress)
  if (connectedAddress !== sessionAddress) {
    setSessionAddress(connectedAddress)
    if (connectedAddress !== undefined && sessionAddress !== undefined) {
      setPaymentBody(null)
      setState(INITIAL_STATE)
    }
  }

  // Mirrors sessionAddress for in-flight async closures: the component stays
  // mounted through an account switch or disconnect, so a reply that resolves
  // after the session changed would otherwise write the old session's turns
  // (or drop the new payer's receipt via the 402 path) into the new session.
  // Layout effect: synced in the same commit task as the reset above, before
  // any pending fetch continuation can run.
  const sessionAddressRef = useRef(sessionAddress)
  useIsomorphicLayoutEffect(() => {
    sessionAddressRef.current = sessionAddress
  }, [ sessionAddress ])

  // Restore a still-valid x402 unlock once the wallet that paid (re)connects -
  // the receipt is wallet-bound, so another payer must pay for itself and a
  // disconnected page stays locked (no paywall flash-then-vanish on mount).
  // Hydration is per ADDRESS, not once per mount: switching A -> B -> A
  // re-restores A's unlock when A returns.
  const unlockHydratedAddressRef = useRef<`0x${string}` | undefined>(undefined)
  useIsomorphicLayoutEffect(() => {
    if (!isConnected || unlockHydratedAddressRef.current === connectedAddress) {
      return
    }
    unlockHydratedAddressRef.current = connectedAddress

    const stored = safeSessionStorage.getItem(X402_STORAGE_KEY)
    if (stored === null) {
      return
    }

    try {
      const restored = JSON.parse(stored) as SignedPaymentBody
      const isOwnUnlock = restored.payer.toLowerCase() === connectedAddress?.toLowerCase()
      const isStillValid = restored.validUntil * 1000 > Date.now()
      if (isOwnUnlock && isStillValid) {

        setPaymentBody(restored)
      } else if (isStillValid) {
        // Another payer's receipt: kept in storage (its owner may switch
        // back), just never unlocks anyone else. The probe flips so the
        // paywall (held back while the receipt looked usable) appears.
        setUnlockProbe('none')
      } else {
        // An expired receipt is dead weight for everyone - drop it.
        safeSessionStorage.removeItem(X402_STORAGE_KEY)
        setUnlockProbe('none')
      }
    } catch {
      safeSessionStorage.removeItem(X402_STORAGE_KEY)
      setUnlockProbe('none')
    }
  }, [ isConnected, connectedAddress ])

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
  // storage so the next wallet starts clean, and re-lock the page. The x402
  // unlock STORAGE is kept - it is a payment receipt, so the same wallet
  // reconnecting restores it without re-paying (another payer cannot: the
  // restore effect drops a foreign receipt).
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
    unlockHydratedAddressRef.current = undefined
    safeSessionStorage.removeItem(CHAT_STORAGE_KEY)
    resetSendTx()
    setPaymentBody(null)
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

  const handleUnlocked = (payment: SignedPaymentBody) => {
    setPaymentBody(payment)
    safeSessionStorage.setItem(X402_STORAGE_KEY, JSON.stringify(payment))
  }

  const sendToAgent = async (next: Message[]) => {
    // The session this request belongs to: every write below goes through
    // patchSessionState (and the 402 path checks it too), so a continuation
    // that resumes after an account switch or disconnect drops its writes
    // instead of leaking them.
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
        body: JSON.stringify({
          messages: modelMessages,
          scenario: 'rwa',
          receiverAddress: connectedAddress,
          payment: paymentBody,
        }),
      })
      const json = (await response.json()) as AgentResponse
      const { reply, envelope: returnedEnvelope, error, hint } = json

      if (!response.ok) {
        // 402 means the stored payment authorization no longer verifies (the
        // 1h validUntil expired): drop it so the paywall re-renders and the
        // user can sign a fresh one without reloading. Session-guarded: a
        // stale 402 must not drop a receipt the next payer just stored.
        if (response.status === 402 && sessionAddressRef.current === requestAddress) {
          setPaymentBody(null)
          safeSessionStorage.removeItem(X402_STORAGE_KEY)
        }

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
      // nothing was signed.
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
    if (trimmed.length === 0 || isLoading || paymentBody === null) {
      return
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }

    // No wallet - no receiver for the envelope (possible if the user
    // disconnects after the x402 unlock). Instead of locking the composer,
    // answer locally with a connect-wallet turn and keep the chat open.
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
    if (!isConnected || isLoading || paymentBody === null) {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the external wagmi connect event into the conversation: resolve the prompt turn and resume the pending request
    void sendToAgent(resolved)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sendToAgent is an unstable closure; the guard above makes the effect idempotent, so reacting to connection + transcript changes is sufficient
  }, [ isConnected, isLoading, paymentBody, messages ])

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
      // mismatch if the wallet sits on another chain. Switch to the envelope's
      // chain first, then sign (the x402 paywall pre-switches, but the user may
      // have moved the wallet since unlocking).
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

      // Robinhood Chain is Arbitrum Orbit and shares Arbitrum's base-fee model, so
      // a tight maxFeePerGas can land just under base fee and the RPC rejects the
      // tx. Read the live fee and double the cap for headroom: the cap is a
      // ceiling, not the price, so the tx still pays only the prevailing base fee.
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
        href: formatTxExplorerUrl(ROBINHOOD_TESTNET_CHAIN_ID, message.txHash),
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
      <span className="font-medium text-foreground">Testnet demo - real enforcement, mock holdings.</span>{' '}
      The RWA router credits a mock holdings ledger (no real equity moves), and each executed buy
      settles a real mock-scale mxUSD transfer to the x402 merchant treasury on-chain. The gate
      checks above run on-chain, verifiable on the explorer.
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
      // SequencerFeeRow omitted: Robinhood Chain (46630) is not an ArbitrumChainId.
      // See comment at top of file.
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
  // The composer is always mounted (locked / review states disable it).
  const lastMessage = messages[messages.length - 1]
  const isReviewing = isPrepared && !isConfirmed && lastMessage?.status === 'prepared'
  // A review restored from storage must appear settled: the Collapse mounts
  // already expanded and the scroll pin lands in one pre-paint jump.
  const isReviewRestored = lastMessage?.isRestored === true
  const isReviewOpen = isReviewing && isReplyTyped
  const isComposerDisabled = isLoading || isReviewing || !isUnlocked
  const inputPlaceholder = resolveInputPlaceholder(isReviewing, !isUnlocked)

  // Once the review opens, align the prepared turn card to the top of the
  // transcript so the agent's summary reads first and the envelope review sits
  // right below it (instead of the default scroll-to-bottom).
  useReviewScrollPin(isReviewOpen, isReviewRestored)

  const composerNode = (
    <div className="space-y-2">
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent"
      >
        <input
          aria-label="Describe an RWA purchase"
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

  // Until the x402 payment is verified the chat is gated: the paywall is the
  // only scroll content, optically centered in the leftover chat height
  // (flex-1 inside ChatShell's min-h-full column; the 2:3 spacer split sits
  // the card slightly above the geometric center), with the composer disabled
  // below it. While a stored receipt is waiting for wagmi to settle the slot
  // stays blank - flashing the paywall right before the unlock restores reads
  // as a glitch; a settled disconnect still shows the paywall.
  const isUnlockStillSettling = unlockProbe === 'pending'
    || (unlockProbe === 'stored' && accountStatus !== 'disconnected')
  const isAwaitingStoredUnlock = isUnlockStillSettling && !hasUnlockWaitExpired
  const isPaywallVisible = !isUnlocked && !isAwaitingStoredUnlock
  const lockedNode = isPaywallVisible ? (
    <div className="flex flex-1 flex-col">
      <div className="grow-[2]" />
      <X402Paywall onUnlocked={handleUnlocked} />
      <div className="grow-[3]" />
    </div>
  ) : null

  // The agent speaks first once the gate opens, doubling as the unlock
  // confirmation - nothing else visually acknowledges the payment (entrance
  // rules live in AgentGreeting). Synthetic: not in `messages`, so it is
  // never persisted or sent to the API.
  const greetingNode = isUnlocked ? (
    <AgentGreeting greetingId="rwa" isInstant={messages.length > 0}>
      Payment verified - you are in. Which stock should I buy: TSLA, AMZN, or PLTR?
    </AgentGreeting>
  ) : null

  // The transcript is meaningful only once unlocked (no messages can exist while
  // gated), so it sits behind the unlock check to keep the locked view clean.
  const transcriptNode = isUnlocked ? (
    <>
      {turnsNode}
      {preparingNode}
      {errorNode}
      {reviewNode}
    </>
  ) : null

  // scrollKey drives ChatShell's auto-scroll-to-bottom on unlock, new turns and
  // the in-flight reply; the prepared review does NOT bottom-scroll - it gets
  // the align-to-top treatment above instead.
  const scrollKey = `${isUnlocked}:${messages.length}:${isLoading}`

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
      {lockedNode}
      {transcriptNode}
    </ChatShell>
  )
}
