import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'


export type A11yFixture = {
  /** Run axe against the current page; returns violations for assertion. */
  scan: (options?: { tags?: string[]; include?: string }) => Promise<{
    violations: Array<{ id: string; impact?: string | null; description: string; nodes: Array<{ target: Array<string | string[]> }> }>
  }>
}


/**
 * Wraps @axe-core/playwright AxeBuilder. Tests opt in by calling
 * `await a11y.scan()` after the page reaches the state under test.
 *
 * Default tags: WCAG 2.1 A + AA. Override via `scan({ tags })`.
 */
export const setupA11y = ({ page }: { page: Page }): A11yFixture => ({
  scan: async (options = {}) => {
    const tags = options.tags || [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa' ]
    let builder = new AxeBuilder({ page }).withTags(tags)

    if (options.include) {
      builder = builder.include(options.include)
    }

    return builder.analyze()
  },
})
