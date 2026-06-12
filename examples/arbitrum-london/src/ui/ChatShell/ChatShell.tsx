'use client'

import { useRef, type ReactNode } from 'react'

import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect'


type ChatShellProps = {
  header: ReactNode,
  pinned?: ReactNode,
  children: ReactNode,
  composer: ReactNode,
  scrollKey: string,
  isFollowing?: boolean,
}

/**
 * LLM-app chat shell: a full-viewport flex column with a fixed header, an
 * optional pinned zone (page intro + banners - always visible, never scrolls),
 * a scrollable transcript (top fade gradient + thin custom scrollbar pushed
 * into the side padding, see .tx-chat-scroll in globals.css), and the composer
 * pinned to the bottom of the screen. Only the chat content scrolls. The
 * transcript auto-scrolls to the bottom whenever `scrollKey` changes (a new
 * turn, a prepared envelope, an execution), so the newest content is always in
 * view like Claude / ChatGPT. While `isFollowing` (a reply in flight) it also
 * follows content that grows between `scrollKey` changes - the narration card
 * mounting after the reply delay, then filling step by step - so every
 * appearing status stays in view. The chats keep `composer` mounted through
 * every state (locked, review) and disable it instead, so the bottom never
 * jumps.
 */
export const ChatShell = (props: ChatShellProps) => {
  const { header, pinned, children, composer, scrollKey, isFollowing } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Layout effect: the scroll position lands before the browser paints, so a
  // freshly added turn (or a restored transcript) never flashes unscrolled.
  useIsomorphicLayoutEffect(() => {
    const node = scrollRef.current
    if (node === null) {
      return
    }

    node.scrollTop = node.scrollHeight
  }, [ scrollKey ])

  // The in-flight narration grows the transcript without touching `scrollKey`,
  // so a key-driven scroll alone leaves the new statuses below the fold once
  // the page overflows. Following the content size keeps the bottom pinned for
  // exactly as long as the reply is awaited: the observer only fires when the
  // column actually changes height (it is min-h-full, so nothing happens until
  // content overflows) and disconnects the moment the reply lands - handing
  // off to the scrollKey scroll and the review align-to-top pin.
  useIsomorphicLayoutEffect(() => {
    const scrollNode = scrollRef.current
    const contentNode = contentRef.current
    if (!isFollowing || scrollNode === null || contentNode === null) {
      return
    }

    const observer = new ResizeObserver(() => {
      scrollNode.scrollTop = scrollNode.scrollHeight
    })

    observer.observe(contentNode)

    return () => observer.disconnect()
  }, [ isFollowing ])

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
        <div ref={contentRef} className="flex min-h-full flex-col space-y-4 pt-3 pb-4 [&>:nth-child(2)]:mt-auto">
          {children}
        </div>
      </div>
      {bottomNode}
    </div>
  )
}
