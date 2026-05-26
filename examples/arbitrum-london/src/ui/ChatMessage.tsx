type ChatMessageProps = {
  role: 'user' | 'assistant',
  content: string,
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === 'user'


  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-[color:var(--color-accent)] text-white'
            : 'bg-[color:var(--color-card)] border border-[color:var(--color-border)]'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
