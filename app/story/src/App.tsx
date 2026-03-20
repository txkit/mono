import { useState, useEffect, useCallback } from 'react'

import { cx } from '@txkit/core'

import PropsTable from './PropsTable'
import SearchModal from './SearchModal'
import PlaygroundToolbar from './PlaygroundToolbar'
import TokenBalanceStory from './stories/TokenBalance'
import TxKitProviderStory from './stories/TxKitProvider'
import ConnectWalletStory from './stories/ConnectWallet'
import ResponsiveToggle from './ResponsiveToggle'
import TransactionButtonStory from './stories/TransactionButton'
import { PlaygroundProvider, usePlayground } from './PlaygroundContext'
import TxKitProviderEmbeddedStory from './stories/TxKitProviderEmbedded'
import { searchItems, componentProps, bundleSizes } from './storyData'

import type { Viewport } from './ResponsiveToggle'


const stories = {
  ConnectWallet: ConnectWalletStory,
  TokenBalance: TokenBalanceStory,
  TransactionButton: TransactionButtonStory,
  TxKitProvider: TxKitProviderStory,
  'Embedded Mode': TxKitProviderEmbeddedStory,
} as const

type StoryName = keyof typeof stories

const storyCount: Record<StoryName, number> = {
  ConnectWallet: 10,
  TokenBalance: 11,
  TransactionButton: 7,
  TxKitProvider: 3,
  'Embedded Mode': 3,
}

const viewportWidths: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
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

const AppContent = () => {
  const [ active, setActive ] = useState<StoryName>(getInitialStory)
  const [ viewport, setViewport ] = useState<Viewport>('desktop')
  const [ searchOpen, setSearchOpen ] = useState(false)
  const { theme } = usePlayground()
  const ActiveStory = stories[active]

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

  const bgClass = theme === 'light' ? 'bg-light' : 'bg-dark'
  const propsData = componentProps[active as keyof typeof componentProps]

  return (
    <div className="playground">
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
          <ResponsiveToggle viewport={viewport} onChange={setViewport} />
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
          propsData && (
            <PropsTable
              componentName={active}
              importPath={propsData.importPath}
              props={[ ...propsData.props ]}
            />
          )
        }
        <div
          className="responsive-viewport"
          style={{ maxWidth: viewportWidths[viewport] }}
        >
          <ActiveStory />
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
