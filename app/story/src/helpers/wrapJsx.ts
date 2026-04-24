/** Wrap a JSX snippet in a full React component for better syntax highlighting.
 *  - Preserves any preamble (imports + const declarations) before the JSX.
 *  - Adds a default `@txkit/react` import if no preamble exists.
 *  - Wraps multi-root JSX (multiple top-level `<Component />` siblings) in a Fragment. */
const wrapJsx = (jsx: string): string => {
  const trimmed = jsx.trim()

  if (!trimmed) {
    return trimmed
  }

  const lines = trimmed.split('\n')
  const jsxStartIdx = lines.findIndex((l) => /^<[A-Z]/.test(l.trim()))

  if (jsxStartIdx === -1) {
    return trimmed
  }

  const preambleLines = lines.slice(0, jsxStartIdx)
  const bodyLines = lines.slice(jsxStartIdx)

  while (preambleLines.length > 0 && preambleLines[preambleLines.length - 1].trim() === '') {
    preambleLines.pop()
  }

  const preamble = preambleLines.join('\n')
  const body = bodyLines.join('\n').trimEnd()

  const firstTagMatch = body.match(/<([A-Z][A-Za-z0-9]*)/)

  if (!firstTagMatch) {
    return trimmed
  }

  const name = firstTagMatch[1]
  const rootOpeners = body.match(/^<[A-Z]/gm) ?? []
  const hasMultipleRoots = rootOpeners.length > 1

  const bodyIndent = hasMultipleRoots ? '    ' : '  '
  const bodyIndented = body.split('\n').map((line) => line ? `${bodyIndent}${line}` : '').join('\n')

  const inner = hasMultipleRoots
    ? `  <>\n${bodyIndented}\n  </>`
    : bodyIndented

  const header = preamble
    ? `${preamble}\n\n`
    : `import { ${name} } from '@txkit/react'\n\n`

  return `${header}const MyComponent: React.FC = () => (
${inner}
)`
}


export default wrapJsx
