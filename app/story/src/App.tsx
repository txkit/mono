import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

import { cx } from '@txkit/core'
import { TxKitProvider } from '@txkit/react'

import {
  Home,
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
  'TxKitProvider',
  'ConnectWallet',
  'TokenBalance',
  'TransactionButton',
  'ThemeShowcase',
]

const storyCount: Record<StoryName, number> = {
  ConnectWallet: 9,
  TokenBalance: 13,
  TransactionButton: 7,
  TxKitProvider: 6,
  ThemeShowcase: 3,
}

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

const unslugify = (slug: string): StoryName | null =>
  storyNames.find((name) => slugify(name) === slug) ?? null

const getInitialStory = (): StoryName | null => {
  const hash = window.location.hash.slice(1)
  if (hash) {
    const found = unslugify(hash)
    if (found) {
      return found
    }
  }
  return null
}

const subscribeSystemTheme = (callback: () => void) => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const AppContent = () => {
  const [ active, setActive ] = useState<StoryName | null>(getInitialStory)
  const { theme, variant, colorScheme } = usePlayground()
  const txKitConfig = useStoryConfig(defaultConfig, undefined)

  const navigate = useCallback((name: StoryName | null) => {
    setActive(name)
    if (name === null) {
      // Clear hash without creating a history entry
      history.replaceState(null, '', window.location.pathname + window.location.search)
    } else {
      window.location.hash = slugify(name)
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        setActive(null)
        return
      }
      const found = unslugify(hash)
      setActive(found)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const systemTheme = useSyncExternalStore(subscribeSystemTheme, getSystemTheme)
  const resolvedTheme = theme === 'auto' ? systemTheme : theme
  const bgClass = resolvedTheme === 'light' ? 'bg-light' : 'bg-dark'
  const propsData = active ? componentProps[active as keyof typeof componentProps] : undefined
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
          <button
            type="button"
            className="playground-brand-link"
            onClick={() => {
              navigate(null)
              setSidebarOpen(false)
            }}
            aria-label="Go to home"
          >
            <img className="playground-brand-icon" src="/logo.svg" alt="txKit" width="24" height="24" />
            <span className="playground-logo">txKit</span>
          </button>
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
          {
            storyNames.map((name) => (
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
            ))
          }
        </nav>
        <div className="playground-sidebar-footer">
          <a
            className="playground-sidebar-github"
            href="https://github.com/txkit/mono"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
            </svg>
            View on GitHub
          </a>
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
        {
          active === null
            ? <Home />
            : (
              <>
                <nav className="playground-breadcrumb" aria-label="Breadcrumb">
                  <button type="button" onClick={() => navigate(null)} className="playground-breadcrumb-link">
                    Components
                  </button>
                  <span aria-hidden="true" className="playground-breadcrumb-sep">/</span>
                  <span className="playground-breadcrumb-current">{active}</span>
                </nav>
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
                    <div className="playground-description">
                      <p className="playground-description-summary">
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
                      {
                        componentDescriptions[active].features && (
                          <ul className="playground-description-features">
                            {
                              componentDescriptions[active].features!.map((feature) => (
                                <li key={feature}>{feature}</li>
                              ))
                            }
                          </ul>
                        )
                      }
                      {
                        componentDescriptions[active].useWhen && (
                          <p className="playground-description-when">
                            <span className="playground-description-when-label">Use when</span>
                            {componentDescriptions[active].useWhen}
                          </p>
                        )
                      }
                    </div>
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
                <div className={cx(`txkit-color-${colorScheme}`, { [`txkit-${variant}`]: variant !== 'default' })}>
                  <StoryErrorBoundary storyKey={active}>
                    <TxKitProvider config={txKitConfig}>
                      <PlaygroundThemeSync />
                      <MemoizedStory key={active} name={active} />
                    </TxKitProvider>
                  </StoryErrorBoundary>
                </div>
              </>
            )
        }
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
