import React from 'react'
import { useState } from 'react'

import { CopyIcon, CheckIcon } from '../Icons/icons'


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
      <button
        type="button"
        className="code-block-copy"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      </button>
      <pre className="code-block-pre" data-lang={language}>
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}


export default CodeBlock
