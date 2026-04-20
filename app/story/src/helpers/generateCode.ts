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

  const lines: string[] = []

  if (importLine) {
    lines.push(importLine, '')
  }

  if (props.length === 0) {
    lines.push(`<${componentName} />`)
  }
  else if (props.length <= 2) {
    lines.push(`<${componentName} ${props.join(' ')} />`)
  }
  else {
    lines.push(`<${componentName}`)
    for (const prop of props) {
      lines.push(`  ${prop}`)
    }
    lines.push('/>')
  }

  return lines.join('\n')
}


export default generateCode
