import React from 'react'

import './Home.css'


const SparklesIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
)

const ZapIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const CodeIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)


const FEATURE_CARDS = [
  {
    Icon: SparklesIcon,
    color: 'blue' as const,
    title: 'Preview States',
    description: 'Flip through every component state - idle, loading, success, error - without connecting a wallet.',
  },
  {
    Icon: ZapIcon,
    color: 'purple' as const,
    title: 'Live Controls',
    description: 'Tweak props in real time and get a ready-to-paste code snippet that matches your configuration.',
  },
  {
    Icon: CodeIcon,
    color: 'green' as const,
    title: 'Copy & Paste',
    description: 'Production-grade examples for common Web3 patterns - approve + execute, chain enforcement, refresh-on-tx.',
  },
]

type HomeProps = {
  onStart: () => void
  startLabel: string
}

const Home: React.FC<HomeProps> = (props) => {
  const {
    onStart,
    startLabel,
  } = props

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <h1 className="home-title">txKit Component Playground</h1>
        <p className="home-tagline">
          Explore, test, and integrate production-ready Web3 UI components for your dApp.
        </p>
      </div>

      <div className="home-cards">
        {FEATURE_CARDS.map((card) => {
          const { Icon } = card

          return (
            <div key={card.title} className="home-card">
              <div className="home-card-icon" data-color={card.color}>
                <Icon />
              </div>
              <h3 className="home-card-title">{card.title}</h3>
              <p className="home-card-description">{card.description}</p>
            </div>
          )
        })}
      </div>

      <button type="button" className="home-cta" onClick={onStart}>
        Explore {startLabel}
        <span aria-hidden="true" className="home-cta-arrow">→</span>
      </button>
    </div>
  )
}


export default Home
