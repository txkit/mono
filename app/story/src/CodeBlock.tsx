import React from 'react'
import { useState } from 'react'


type CodeBlockProps = {
  code: string
  language?: string
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'tsx' }) => {
  const [ copied, setCopied ] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button
          type="button"
          className="code-block-copy"
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}


export default CodeBlock
