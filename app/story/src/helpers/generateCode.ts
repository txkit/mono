import type { ControlEntry } from '../components/ControlPanel/useControls'


type GenerateCodeOptions = {
  /** Props to exclude from output */
  exclude?: string[]
  /** Custom prop formatters - return JSX value string or null to skip */
  formatProp?: Record<string, (value: boolean | string | number) => string | null>
  /** Import statement to prepend */
  importLine?: string
}

/** Generate a JSX code snippet from the current control values.
 *  Only non-default props are included for cleaner output. */
const generateCode = (
  componentName: string,
  entries: ControlEntry[],
  options: GenerateCodeOptions = {}
): string => {
  const { exclude = [], formatProp = {}, importLine } = options

  const props: string[] = []

  for (const entry of entries) {
    const { key, def, value } = entry

    // Skip excluded and state-machine controls
    if (exclude.includes(key) || def.type === 'state') {
      continue
    }

    // Skip props at their default value
    if (value === def.default) {
      continue
    }

    // Custom formatter
    if (formatProp[key]) {
      const formatted = formatProp[key](value)
      if (formatted !== null) {
        props.push(`${key}=${formatted}`)
      }
      continue
    }

    // Auto-format by type
    if (def.type === 'boolean') {
      props.push(value ? key : `${key}={false}`)
    }
    else if (def.type === 'number') {
      props.push(`${key}={${value}}`)
    }
    else {
      props.push(`${key}="${value}"`)
    }
  }

  const jsxLines: string[] = []

  if (props.length === 0) {
    jsxLines.push(`<${componentName} />`)
  }
  else if (props.length <= 2) {
    jsxLines.push(`<${componentName} ${props.join(' ')} />`)
  }
  else {
    jsxLines.push(`<${componentName}`)
    for (const prop of props) {
      jsxLines.push(`  ${prop}`)
    }
    jsxLines.push('/>')
  }

  const lines: string[] = []

  if (importLine) {
    lines.push(importLine, '')
    lines.push('const MyComponent: React.FC = () => (')
    for (const line of jsxLines) {
      lines.push(`  ${line}`)
    }
    lines.push(')')
  }
  else {
    lines.push(...jsxLines)
  }

  return lines.join('\n')
}


export default generateCode
