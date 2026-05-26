'use client'

import { useState, type FormEvent } from 'react'

import { ChatMessage } from '@/src/ui/ChatMessage'


type Message = { role: 'user' | 'assistant', content: string }

/**
 * Day 3 client: round-trips messages through /api/agent (Claude echo).
 * Day 4 extends with tool-call handling + envelope fetch + EnvelopePreview.
 * Day 6 wires TransactionButton for signing.
 */
export const PendleAgentChat = () => {
  const [ messages, setMessages ] = useState<Message[]>([])
  const [ input, setInput ] = useState('')
  const [ isLoading, setLoading ] = useState(false)
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length === 0 || isLoading) {
      return
    }

    const userMessage: Message = { role: 'user', content: trimmed }
    const next = [ ...messages, userMessage ]
    setMessages(next)
    setInput('')
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, scenario: 'pendle' }),
      })
      const json = await response.json()

      if (!response.ok) {
        setErrorMessage(json.error ?? 'Agent request failed')
        return
      }

      setMessages([ ...next, { role: 'assistant', content: json.reply ?? '(empty reply)' } ])
    } catch (networkError) {
      setErrorMessage(`Network error: ${String(networkError)}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <section className="space-y-4">
      <div className="space-y-3 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="opacity-50 text-sm italic">
            Try: &ldquo;Swap 100 USDC for PT-stETH&rdquo; (Day 3 echoes back; Day 4 returns a real envelope)
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))
        )}
        {isLoading ? (
          <div className="opacity-60 text-sm">Agent thinking&hellip;</div>
        ) : null}
      </div>

      {errorMessage !== null ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-sm"
          placeholder="Describe a yield rotation..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  )
}
