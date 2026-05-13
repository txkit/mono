// Remark plugin - inject minutesRead into frontmatter at build time.
// DIY (no reading-time npm dep): WPM = 220 (closer to engineer reading
// of technical prose), minimum 1 minute. Walks mdast tree, sums text
// nodes, divides by WPM.

const WORDS_PER_MINUTE = 220

const collectText = (node, accumulator) => {
  if (node.value && typeof node.value === 'string') {
    accumulator.push(node.value)
  }
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => collectText(child, accumulator))
  }
}


export const remarkReadingTime = () => (tree, { data }) => {
  const parts = []
  collectText(tree, parts)

  const wordCount = parts.join(' ').trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

  data.astro.frontmatter.minutesRead = minutes
}
