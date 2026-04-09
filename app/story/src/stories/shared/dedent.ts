const dedent = (strings: TemplateStringsArray, ...values: unknown[]): string => {
  let result = strings.reduce((acc, str, index) =>
    acc + str + (index < values.length ? String(values[index]) : ''), '')

  // Remove leading/trailing blank lines
  result = result.replace(/^\n/, '').replace(/\n\s*$/, '')

  const lines = result.split('\n')
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^(\s*)/)?.[1].length ?? 0)

  const minIndent = Math.min(...indents)

  if (minIndent > 0) {
    return lines.map((line) => line.slice(minIndent)).join('\n')
  }

  return result
}


export default dedent
