import React from 'react'

import sparklesIcon from '../../assets/icons/sparkles.svg'
import zapIcon from '../../assets/icons/zap.svg'
import codeIcon from '../../assets/icons/code.svg'

import './Home.css'


const FEATURE_CARDS = [
  {
    icon: sparklesIcon,
    color: 'blue' as const,
    title: 'Preview States',
    description: 'Flip through every component state - idle, loading, success, error - without connecting a wallet.',
  },
  {
    icon: zapIcon,
    color: 'purple' as const,
    title: 'Live Controls',
    description: 'Tweak props in real time and get a ready-to-paste code snippet that matches your configuration.',
  },
  {
    icon: codeIcon,
    color: 'green' as const,
    title: 'Copy & Paste',
    description: 'Production-grade examples for common Web3 patterns - approve + execute, chain enforcement, refresh-on-tx.',
  },
]

const Home: React.FC = () => (
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
      {FEATURE_CARDS.map((card) => (
        <div key={card.title} className="home-card">
          <div
            className="home-card-icon"
            data-color={card.color}
            style={{ '--home-icon-url': `url(${card.icon})` } as React.CSSProperties}
            aria-hidden="true"
          />
          <h3 className="home-card-title">{card.title}</h3>
          <p className="home-card-description">{card.description}</p>
        </div>
      ))}
    </div>

    <p className="home-hint">
      Select a component from the sidebar to get started
      <span aria-hidden="true"> →</span>
    </p>
  </div>
)


export default Home
