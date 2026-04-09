import React, { Component, useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

import { cx } from '@txkit/core'

import PropsTable from './PropsTable'
import SearchModal from './SearchModal'
import PlaygroundToolbar from './PlaygroundToolbar'
import ContractFormStory from './stories/ContractForm/ContractForm'
import TokenBalanceStory from './stories/TokenBalance/TokenBalance'
import ConnectWalletStory from './stories/ConnectWallet/ConnectWallet'
import TxKitProviderStory from './stories/TxKitProvider/TxKitProvider'
import TransactionButtonStory from './stories/TransactionButton/TransactionButton'
import { PlaygroundProvider, usePlayground } from './PlaygroundContext'
import { searchItems, componentProps, bundleSizes, componentDescriptions } from './storyData'



type StoryErrorBoundaryState = { hasError: boolean; error: Error | null }

class StoryErrorBoundary extends Component<{ children: ReactNode; storyKey: string }, StoryErrorBoundaryState> {
  state: StoryErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): StoryErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Playground] Story error:', error, info.componentStack)
  }

  componentDidUpdate(prevProps: { storyKey: string }) {
    if (prevProps.storyKey !== this.props.storyKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="story-card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 12 }}>
            <strong>Story Error:</strong> {this.state.error?.message}
          </p>
          <button
            type="button"
            className="story-code-toggle"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}


const stories = {
  ConnectWallet: ConnectWalletStory,
  TokenBalance: TokenBalanceStory,
  TransactionButton: TransactionButtonStory,
  ContractForm: ContractFormStory,
  TxKitProvider: TxKitProviderStory,
} as const

type StoryName = keyof typeof stories

const storyCount: Record<StoryName, number> = {
  ConnectWallet: 9,
  TokenBalance: 13,
  TransactionButton: 7,
  ContractForm: 6,
  TxKitProvider: 6,
}

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

const unslugify = (slug: string): StoryName | null => {
  const names = Object.keys(stories) as StoryName[]
  return names.find((name) => slugify(name) === slug) ?? null
}

const getInitialStory = (): StoryName => {
  const hash = window.location.hash.slice(1)
  if (hash) {
    const found = unslugify(hash)
    if (found) {
      return found
    }
  }
  return 'ConnectWallet'
}

/** Memoized story renderer - prevents wagmi useSyncExternalStore crash
 *  when playground theme/colorScheme changes trigger parent re-render.
 *  Variant is passed as prop so stories don't subscribe to PlaygroundContext
 *  (context subscription bypasses React.memo and triggers wagmi infinite loops). */
const MemoizedStory = React.memo(({ name, variant }: { name: StoryName; variant: TxKit.Variant }) => {
  const Story = stories[name]
  return <Story variant={variant} />
})
MemoizedStory.displayName = 'MemoizedStory'


const subscribeSystemTheme = (callback: () => void) => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const AppContent = () => {
  const [ active, setActive ] = useState<StoryName>(getInitialStory)
  const [ searchOpen, setSearchOpen ] = useState(false)
  const { theme, variant, colorScheme } = usePlayground()

  const navigate = useCallback((name: StoryName) => {
    setActive(name)
    window.location.hash = slugify(name)
  }, [])

  const handleSearchSelect = useCallback((storyName: string) => {
    const found = Object.keys(stories).find((k) => k === storyName) as StoryName | undefined
    if (found) {
      navigate(found)
    }
  }, [ navigate ])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      const found = unslugify(hash)
      if (found) {
        setActive(found)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const systemTheme = useSyncExternalStore(subscribeSystemTheme, getSystemTheme)
  const resolvedTheme = theme === 'auto' ? systemTheme : theme
  const bgClass = resolvedTheme === 'light' ? 'bg-light' : 'bg-dark'
  const propsData = componentProps[active as keyof typeof componentProps]

  return (
    <div className={cx('playground', bgClass)}>
      <aside className="playground-sidebar">
        <h1 className="playground-logo">txKit</h1>
        <button
          type="button"
          className="search-trigger"
          onClick={() => setSearchOpen(true)}
        >
          Search <kbd>⌘K</kbd>
        </button>
        <nav>
          {(Object.keys(stories) as StoryName[]).map((name) => (
            <button
              key={name}
              type="button"
              className={cx('playground-nav-item', { active: name === active })}
              onClick={() => navigate(name)}
            >
              <span>{name}</span>
              <span className="playground-nav-count">{storyCount[name]}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className={cx('playground-main', bgClass)}>
        <div className="playground-toolbar-row">
          <PlaygroundToolbar />
        </div>
        <div className="playground-title-row">
          <h2 className="playground-title">{active}</h2>
          {
            bundleSizes[active] && (
              <div className="bundle-badges">
                <span className="bundle-badge" title="Gzipped JS size">JS {bundleSizes[active].js}</span>
                <span className="bundle-badge" title="Gzipped CSS size">CSS {bundleSizes[active].css}</span>
              </div>
            )
          }
        </div>
        {
          componentDescriptions[active] && (
            <p className="playground-description">
              {componentDescriptions[active].summary}
              {
                componentDescriptions[active].docsPath && (
                  <>
                    {' '}
                    <a
                      href={`https://docs.txkit.dev${componentDescriptions[active].docsPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="playground-docs-link"
                    >
                      Docs&nbsp;&#8599;
                    </a>
                  </>
                )
              }
            </p>
          )
        }
        {
          propsData && (
            <PropsTable
              componentName={active}
              importPath={propsData.importPath}
              props={[ ...propsData.props ]}
            />
          )
        }
        <div
          className={cx({
            'txkit-color-violet': colorScheme === 'violet',
          })}
        >
          <StoryErrorBoundary storyKey={active}>
            <MemoizedStory name={active} variant={variant} />
          </StoryErrorBoundary>
        </div>
      </main>
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
        items={searchItems}
      />
    </div>
  )
}

const App = () => {
  return (
    <PlaygroundProvider>
      <AppContent />
    </PlaygroundProvider>
  )
}


export default App
