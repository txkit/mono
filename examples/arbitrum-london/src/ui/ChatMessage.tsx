type ChatMessageProps = {
  role: 'user' | 'assistant',
  content: string,
}

export const ChatMessage = (props: ChatMessageProps) => {
  const { role, content } = props
  const isUser = role === 'user'
  const bubbleClass = isUser
    ? 'bg-[color:var(--color-accent)] text-[color:var(--color-accent-text)]'
    : 'bg-[color:var(--color-card)] border border-[color:var(--color-border)]'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${bubbleClass}`}>
        {content}
      </div>
    </div>
  )
}
