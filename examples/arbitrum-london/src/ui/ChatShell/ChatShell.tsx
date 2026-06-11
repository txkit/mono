'use client'

import { useEffect, useRef, type ReactNode } from 'react'


type ChatShellProps = {
  header: ReactNode,
  children: ReactNode,
  composer: ReactNode,
  scrollKey: string,
}

/**
 * LLM-app chat shell: a full-viewport flex column with a fixed header, a
 * scrollable transcript (top fade gradient + thin custom scrollbar, see
 * .tx-chat-scroll in globals.css), and a composer pinned to the bottom of the
 * screen. The transcript auto-scrolls to the bottom whenever `scrollKey` changes
 * (a new turn, a prepared envelope, an execution), so the newest content is
 * always in view like Claude / ChatGPT. `composer` is omitted (null) while an
 * envelope is under review or the flow is gated, so only the transcript and its
 * inline actions remain.
 */
export const ChatShell = (props: ChatShellProps) => {
  const { header, children, composer, scrollKey } = props
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node === null) {
      return
    }

    node.scrollTop = node.scrollHeight
  }, [ scrollKey ])

  const composerNode = composer !== null ? (
    <div className="shrink-0 border-t border-border bg-background/80 pt-3 pb-6 backdrop-blur">
      {composer}
    </div>
  ) : null

  return (
    <div className="mx-auto flex h-[100dvh] max-w-3xl flex-col px-6">
      <div className="shrink-0 pt-6 pb-3">
        {header}
      </div>
      <div ref={scrollRef} className="tx-chat-scroll min-h-0 flex-1">
        <div className="space-y-4 pt-3 pb-4">
          {children}
        </div>
      </div>
      {composerNode}
    </div>
  )
}
