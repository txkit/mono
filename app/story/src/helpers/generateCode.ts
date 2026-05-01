import type { ControlEntry, ControlValue } from '../components/ControlPanel/useControls'


type GenerateCodeOptions = {
  /** Props to exclude from output */
  exclude?: string[]
  /** Custom prop formatters - return JSX value string or null to skip */
  formatProp?: Record<string, (value: ControlValue) => string | null>
  /** Import statement to prepend */
  importLine?: string
  /** Always-rendered props prepended before the control-driven props (e.g. `steps={steps}`). */
  fixedProps?: string[]
  /** Source lines inserted between the import block and the component declaration. */
  prelude?: string[]
  /** Sibling JSX rendered after the main component (each entry is one line, kept indented inside the fragment). */
  trailingJsx?: string[]
}

/** Generate a JSX code snippet from the current control values.
 *  Only non-default props are included for cleaner output. */
const generateCode = (
  componentName: string,
  entries: ControlEntry[],
  options: GenerateCodeOptions = {}
): string => {
  const { exclude = [], formatProp = {}, importLine, fixedProps = [], prelude = [], trailingJsx = [] } = options

  const props: string[] = [ ...fixedProps ]

  for (const entry of entries) {
    const { key, def, value } = entry

    // Skip excluded and state-machine controls
    if (exclude.includes(key) || def.type === 'state') {
      continue
    }

    // Skip props at their default value (icon-source uses formatProp to decide)
    if (def.type !== 'icon-source' && value === def.default) {
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

    // icon-source without formatProp is a no-op (caller must resolve URL)
    if (def.type === 'icon-source') {
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
    if (prelude.length > 0) {
      lines.push(...prelude, '')
    }
    lines.push('const MyComponent: React.FC = () => (')
    if (trailingJsx.length > 0) {
      lines.push('  <>')
      for (const line of jsxLines) {
        lines.push(`    ${line}`)
      }
      for (const line of trailingJsx) {
        lines.push(`    ${line}`)
      }
      lines.push('  </>')
    }
    else {
      for (const line of jsxLines) {
        lines.push(`  ${line}`)
      }
    }
    lines.push(')')
  }
  else {
    lines.push(...jsxLines)
  }

  return lines.join('\n')
}


export default generateCode
