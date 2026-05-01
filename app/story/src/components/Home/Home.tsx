import React from 'react'

import './Home.css'


type HeroIconProps = {
  size?: number
}

const HeroIcon: React.FC<HeroIconProps> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </svg>
)

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

const ArrowRightIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

type FeatureColor = 'blue' | 'purple' | 'green'

type FeatureCard = {
  icon: React.ComponentType
  color: FeatureColor
  title: string
  description: string
}

const FEATURE_CARDS: readonly FeatureCard[] = [
  {
    icon: SparklesIcon,
    color: 'blue',
    title: 'Never holds keys',
    description: 'Orchestrator, not signer. Composes with any wagmi connector, RainbowKit, AppKit, Privy, OWS - keys stay in your wallet.',
  },
  {
    icon: ZapIcon,
    color: 'purple',
    title: 'Anti-phishing defenses',
    description: 'Pre-sign simulation, MAX-approval warning, decoded calldata preview, pluggable risk provider (Blowfish / Blockaid).',
  },
  {
    icon: CodeIcon,
    color: 'green',
    title: 'Open envelope spec',
    description: 'PreparedEnvelope shape with attack-defense fields for Drift, Bybit, Kelp, address poisoning. Composable with MoonPay OWS.',
  },
]

type HomeProps = {
  onStart?: () => void
  startLabel?: string
}

const Home: React.FC<HomeProps> = ({ onStart, startLabel = 'Explore components' }) => (
  <div className="home-page">
    <div className="home-inner">
      <div className="home-hero">
        <div className="home-hero-icon">
          <HeroIcon />
        </div>
        <h1 className="home-title">txKit Component Playground</h1>
        <p className="home-tagline">
          Safe bridge between AI agents and Web3 transactions - explore the components, hook them up to your wagmi config, copy code snippets.
        </p>
      </div>

      <div className="home-cards">
        {FEATURE_CARDS.map((card) => {
          const IconComponent = card.icon
          return (
            <div key={card.title} className="home-card">
              <div className="home-card-icon" data-color={card.color} aria-hidden="true">
                <IconComponent />
              </div>
              <h3 className="home-card-title">{card.title}</h3>
              <p className="home-card-description">{card.description}</p>
            </div>
          )
        })}
      </div>

      <button type="button" className="home-hint" onClick={onStart}>
        <span>{startLabel}</span>
        <ArrowRightIcon />
      </button>
    </div>
  </div>
)


export default Home
