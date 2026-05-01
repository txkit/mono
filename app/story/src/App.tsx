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
  'TransactionButton',
  'FlowSteps',
  'FlowProgress',
  'FlowToast',
  'ConnectWallet',
  'TokenBalance',
  'TxKitProvider',
  'ThemeShowcase',
]

const storyCount: Record<StoryName, number> = {
  ConnectWallet: 9,
  TokenBalance: 13,
  TransactionButton: 7,
  FlowSteps: 4,
  FlowProgress: 4,
  FlowToast: 4,
  TxKitProvider: 6,
  ThemeShowcase: 3,
}

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

const unslugify = (slug: string): StoryName | null =>
  storyNames.find((name) => slugify(name) === slug) ?? null

const getInitialStory = (): StoryName | null => {
  const hash = window.location.hash.slice(1)
  if (hash) {
    const [ storySlug ] = hash.split('/')
    const found = unslugify(storySlug)
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
      const [ storySlug, sectionSlug ] = hash.split('/')
      const found = unslugify(storySlug)
      if (found) {
        setActive(found)
        if (sectionSlug) {
          requestAnimationFrame(() => {
            document.getElementById(sectionSlug)?.scrollIntoView({ block: 'start' })
          })
        }
      }
      // else: unknown hash - preserve current state (don't fall back to Home)
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
            storyNames.map((name) => {
              const isSub = Boolean(componentDescriptions[name]?.parent)
              return (
                <button
                  key={name}
                  type="button"
                  className={cx('playground-nav-item', { active: name === active, 'playground-nav-sub': isSub })}
                  onClick={() => {
                    navigate(name)
                    setSidebarOpen(false)
                  }}
                >
                  <span>{name}</span>
                  <span className="playground-nav-count">{storyCount[name]}</span>
                </button>
              )
            })
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
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
            ? <Home onStart={() => navigate(storyNames[0])} startLabel="Get started" />
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
                <div className={cx(`tx-color-${colorScheme}`, { [`tx-${variant}`]: variant !== 'default' })}>
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
