type ChatMessageProps = {
  role: 'user' | 'assistant',
  content: string,
}

export const ChatMessage = (props: ChatMessageProps) => {
  const { role, content } = props
  const isUser = role === 'user'
  const alignClass = isUser ? 'justify-end' : 'justify-start'
  const bubbleClass = isUser
    ? 'bg-accent text-accent-text'
    : 'bg-card border border-border'

  return (
    <div className={`flex ${alignClass}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${bubbleClass}`}>
        {content}
      </div>
    </div>
  )
}
