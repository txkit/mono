'use client'

import { openConnectWalletModal } from '@/src/ui/openConnectWalletModal'

import { BotTurnEntrance } from './BotTurnEntrance'
import { AgentReasoning } from './AgentReasoning/AgentReasoning'


type ConnectWalletPromptProps = {
  isResolved?: boolean,
  isInstant?: boolean,
}

/**
 * Assistant turn appended when a prompt is submitted without a connected
 * wallet. The chat stays open (composer never locks on connection state); this
 * turn answers locally with a "connect wallet" link instead of calling the
 * agent, since no signable envelope can be produced without a receiver. Styled
 * as the same AgentReasoning card every other bot turn uses, entering via
 * BotTurnEntrance (the turn lands in the same commit as the user's message,
 * so it holds the reply beat; `isInstant` restores render settled). Once the
 * wallet connects, the card resolves in place (green "Wallet connected", the
 * fulfilled CTA swaps to a thank-you) with no replayed entrance, and the chat
 * auto-resumes the pending request.
 */
export const ConnectWalletPrompt = (props: ConnectWalletPromptProps) => {
  const { isResolved, isInstant } = props

  const resolvedCardNode = (
    <AgentReasoning reasoningLines={[]} status="connected">
      <p className="text-sm leading-relaxed text-foreground">
        Thanks for connecting.
      </p>
    </AgentReasoning>
  )

  const promptCardNode = (
    <AgentReasoning reasoningLines={[]} status="connect">
      <p className="text-sm leading-relaxed text-foreground">
        Please{' '}
        <button
          type="button"
          onClick={openConnectWalletModal}
          className="rounded text-accent underline transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          connect wallet
        </button>
        {' '}to continue.
      </p>
    </AgentReasoning>
  )

  return (
    <BotTurnEntrance isInstant={isInstant}>
      {isResolved ? resolvedCardNode : promptCardNode}
    </BotTurnEntrance>
  )
}
