'use client'

import { useEffect, useRef, type ReactNode } from 'react'


type ChatShellProps = {
  header: ReactNode,
  pinned?: ReactNode,
  children: ReactNode,
  composer: ReactNode,
  scrollKey: string,
}

/**
 * LLM-app chat shell: a full-viewport flex column with a fixed header, an
 * optional pinned zone (page intro + banners - always visible, never scrolls),
 * a scrollable transcript (top fade gradient + thin custom scrollbar pushed
 * into the side padding, see .tx-chat-scroll in globals.css), and the composer
 * pinned to the bottom of the screen. Only the chat content scrolls. The
 * transcript auto-scrolls to the bottom whenever `scrollKey` changes (a new
 * turn, a prepared envelope, an execution), so the newest content is always in
 * view like Claude / ChatGPT. The chats keep `composer` mounted through every
 * state (locked, review) and disable it instead, so the bottom never jumps.
 */
export const ChatShell = (props: ChatShellProps) => {
  const { header, pinned, children, composer, scrollKey } = props
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node === null) {
      return
    }

    node.scrollTop = node.scrollHeight
  }, [ scrollKey ])

  const pinnedNode = pinned !== undefined && pinned !== null ? (
    <div className="shrink-0 space-y-4 pt-3 pb-4">
      {pinned}
    </div>
  ) : null

  const bottomNode = composer !== null ? (
    <div className="shrink-0 border-t border-border bg-background/80 pt-3 pb-6 backdrop-blur">
      {composer}
    </div>
  ) : null

  return (
    <div className="mx-auto flex h-[100dvh] max-w-3xl flex-col px-6">
      <div className="shrink-0 pt-6 pb-3">
        {header}
      </div>
      {pinnedNode}
      {/* min-h-full + flex column lets a child claim the leftover height with
          flex-1 (the RWA paywall centers itself vertically that way). The first
          child is always the page note - it stays at the top; mt-auto on the
          SECOND child (the first conversation turn) bottom-anchors a short
          transcript, so new messages appear right above the composer. Once
          content overflows - or a flex-1 child like the paywall absorbs the
          free space - the auto margin collapses to zero and the column flows
          top-down. */}
      <div ref={scrollRef} className="tx-chat-scroll min-h-0 flex-1">
        <div className="flex min-h-full flex-col space-y-4 pt-3 pb-4 [&>:nth-child(2)]:mt-auto">
          {children}
        </div>
      </div>
      {bottomNode}
    </div>
  )
}
