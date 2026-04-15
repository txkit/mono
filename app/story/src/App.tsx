import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

import { cx } from '@txkit/core'
import { TxKitProvider } from '@txkit/react'

import {
  PropsTable,
  MemoizedStory,
  usePlayground,
  ExternalLinkIcon,
  PlaygroundToolbar,
  PlaygroundProvider,
  PlaygroundThemeSync,
  StoryErrorBoundary,
} from './components'
import { defaultConfig, useStoryConfig } from './config'
import { componentProps, bundleSizes, componentDescriptions } from './storyData'
import type { StoryName } from './components'


const storyNames: readonly StoryName[] = [
  'ConnectWallet',
  'TokenBalance',
  'TransactionButton',
  'ContractForm',
  'TxKitProvider',
  'ThemeShowcase',
]

const storyCount: Record<StoryName, number> = {
  ConnectWallet: 9,
  TokenBalance: 13,
  TransactionButton: 7,
  ContractForm: 6,
  TxKitProvider: 6,
  ThemeShowcase: 3,
}

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

const unslugify = (slug: string): StoryName | null =>
  storyNames.find((name) => slugify(name) === slug) ?? null

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

const subscribeSystemTheme = (callback: () => void) => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const AppContent = () => {
  const [ active, setActive ] = useState<StoryName>(getInitialStory)
  const { theme, variant, colorScheme } = usePlayground()
  const txKitConfig = useStoryConfig(defaultConfig, undefined, variant)

  const navigate = useCallback((name: StoryName) => {
    setActive(name)
    window.location.hash = slugify(name)
  }, [])

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

  const systemTheme = useSyncExternalStore(subscribeSystemTheme, getSystemTheme)
  const resolvedTheme = theme === 'auto' ? systemTheme : theme
  const bgClass = resolvedTheme === 'light' ? 'bg-light' : 'bg-dark'
  const propsData = componentProps[active as keyof typeof componentProps]
  const [ sidebarOpen, setSidebarOpen ] = useState(false)

  return (
    <div className={cx('playground', bgClass)}>
      {/* Mobile overlay */}
      {
        sidebarOpen && (
          <div
            className="playground-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )
      }
      <aside className={cx('playground-sidebar', { open: sidebarOpen })}>
        <div className="playground-brand">
          <div className="playground-brand-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="playground-logo">txKit</span>
          <button
            type="button"
            className="playground-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            &#10005;
          </button>
        </div>
        <nav className="playground-nav">
          {storyNames.map((name) => (
            <button
              key={name}
              type="button"
              className={cx('playground-nav-item', { active: name === active })}
              onClick={() => {
                navigate(name)
                setSidebarOpen(false)
              }}
            >
              <span>{name}</span>
              <span className="playground-nav-count">{storyCount[name]}</span>
            </button>
          ))}
        </nav>
        <div className="playground-sidebar-footer">
          <span className="playground-sidebar-version">v0.1.0</span>
        </div>
      </aside>
      <main className="playground-main">
        <div className="playground-toolbar-row">
          <button
            type="button"
            className="playground-mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            &#9776;
          </button>
          <PlaygroundToolbar />
        </div>
        <div className="playground-content">
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
                      Docs <ExternalLinkIcon size={12} />
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
        <div className={`txkit-color-${colorScheme}`}>
          <StoryErrorBoundary storyKey={active}>
            <TxKitProvider config={txKitConfig}>
              <PlaygroundThemeSync />
              <MemoizedStory key={active} name={active} />
            </TxKitProvider>
          </StoryErrorBoundary>
        </div>
        </div>
      </main>
    </div>
  )
}

const App = () => (
  <PlaygroundProvider>
    <AppContent />
  </PlaygroundProvider>
)


export default App
