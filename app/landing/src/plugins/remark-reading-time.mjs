import getReadingTime from 'reading-time'
import { toString } from 'mdast-util-to-string'


// Remark plugin - injects minutesRead into frontmatter at build time.
// Astro-specific: writes to data.astro.frontmatter, accessible as
// entry.data.minutesRead when minutesRead is in the collection schema.

export const remarkReadingTime = () => (tree, { data }) => {
  const textOnPage = toString(tree)
  const readingTime = getReadingTime(textOnPage)

  data.astro.frontmatter.minutesRead = Math.max(1, Math.ceil(readingTime.minutes))
}
