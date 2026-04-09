import React from 'react'
import { useState } from 'react'


type PropDef = {
  name: string
  type: string
  default?: string
  required?: boolean
  description: string
}

type PropsTableProps = {
  componentName: string
  importPath: string
  props: PropDef[]
}

const PropsTable: React.FC<PropsTableProps> = ({ componentName, importPath, props }) => {
  const [ expanded, setExpanded ] = useState(false)
  const [ copied, setCopied ] = useState(false)

  const importStatement = `import { ${componentName} } from '${importPath}'`

  const handleCopyImport = async () => {
    await navigator.clipboard.writeText(importStatement)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const requiredCount = props.filter((p) => p.required).length

  return (
    <div className="props-table-wrapper">
      <div className="props-table-header">
        <button
          type="button"
          className="props-table-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          <span className={`props-table-chevron ${expanded ? '' : 'collapsed'}`}>&#9660;</span>
          <span className="props-table-title">Props</span>
          <span className="props-table-count">{props.length}</span>
          {
            requiredCount > 0 && (
              <span className="props-table-required-count">{requiredCount} required</span>
            )
          }
        </button>
        <button
          type="button"
          className="props-table-import"
          onClick={handleCopyImport}
          title="Copy import statement"
        >
          <code>{importStatement}</code>
          <span>{copied ? 'Copied!' : '⎘'}</span>
        </button>
      </div>
      {
        expanded && (
          <table className="props-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {
                props.map((p) => (
                  <tr key={p.name} className={p.required ? 'props-table-row-required' : ''}>
                    <td className="props-table-name">
                      {p.name}
                      {
                        p.required && (
                          <span className="props-table-required" title="Required">*</span>
                        )
                      }
                    </td>
                    <td className="props-table-type">{p.type}</td>
                    <td className="props-table-default">{p.default ?? '-'}</td>
                    <td className="props-table-desc">{p.description}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )
      }
    </div>
  )
}


export default PropsTable
