import React, { useState, useSyncExternalStore } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import tsxLang from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import cssLang from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

import { CopyIcon, CheckIcon } from '../Icons/icons'
import { usePlayground } from '../PlaygroundContext/PlaygroundContext'


SyntaxHighlighter.registerLanguage('tsx', tsxLang)
SyntaxHighlighter.registerLanguage('typescript', tsxLang)
SyntaxHighlighter.registerLanguage('css', cssLang)


type CodeBlockProps = {
  code: string
  language?: string
  showLineNumbers?: boolean
}

const subscribeSystemTheme = (callback: () => void) => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getServerTheme = (): 'light' | 'dark' => 'dark'

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'tsx', showLineNumbers = true }) => {
  const { theme } = usePlayground()
  const systemTheme = useSyncExternalStore(subscribeSystemTheme, getSystemTheme, getServerTheme)
  const resolvedTheme = theme === 'auto' ? systemTheme : theme
  const [ copied, setCopied ] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isDark = resolvedTheme === 'dark'
  const style = isDark ? atomOneDark : atomOneLight

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
      <SyntaxHighlighter
        language={language}
        style={style}
        showLineNumbers={showLineNumbers}
        wrapLongLines={false}
        customStyle={{
          margin: 0,
          padding: '16px 48px 16px 20px',
          background: 'transparent',
          fontSize: '0.8125rem',
          lineHeight: '1.55',
          overflowX: 'auto',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--tx-font-mono, ui-monospace, Menlo, monospace)',
            background: 'transparent',
          },
        }}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)',
          userSelect: 'none',
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  )
}


export default CodeBlock
