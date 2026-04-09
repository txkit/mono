import StorySection from '../../StorySection'


const PreviewTab = () => (
  <>
    <p className="story-description">Visual states without wallet connection</p>

    <StorySection
      title="Shimmer Loading (Inline)"
      description="Demo - Shimmer gradient sweep animation while fetching balance data"
    >
      <div
        className="txkit-root txkit-dark"
        style={{ display: 'inline-block' }}
      >
        <span className="txkit-tb" data-state="loading">
          <span className="txkit-tb-icon-wrap">
            <span className="txkit-tb-icon-fallback" style={{ backgroundColor: '#888' }}>&nbsp;</span>
          </span>
          <span className="txkit-tb-amount">Loading...</span>
          <span className="txkit-tb-fiat">$0.00</span>
        </span>
      </div>
    </StorySection>

    <StorySection
      title="Shimmer Loading (Row)"
      description="Demo - Row variant skeleton with name and values placeholders"
    >
      <div
        className="txkit-root txkit-dark"
        style={{ display: 'block', maxWidth: 320 }}
      >
        <span className="txkit-tb txkit-tb-row" data-state="loading">
          <span className="txkit-tb-icon-wrap">
            <span className="txkit-tb-icon-fallback" style={{ backgroundColor: '#888' }}>&nbsp;</span>
          </span>
          <span className="txkit-tb-info">
            <span className="txkit-tb-name">Token Name</span>
            <span className="txkit-tb-symbol">SYM</span>
          </span>
          <span className="txkit-tb-values">
            <span className="txkit-tb-amount">0.0000</span>
            <span className="txkit-tb-fiat">$0.00</span>
          </span>
        </span>
      </div>
    </StorySection>

    <StorySection
      title="Error State"
      description="Demo - How the component looks when balance fetch fails"
    >
      <div className="txkit-root txkit-dark" style={{ display: 'inline-block' }}>
        <span className="txkit-tb" data-state="error">
          <span className="txkit-tb-amount" style={{ color: 'var(--txkit-color-error, #ef4444)' }}>
            Failed to load
          </span>
        </span>
      </div>
    </StorySection>

    <StorySection
      title="Zero Balance"
      description="Demo - Zero balance with dimmed styling"
    >
      <div className="txkit-root txkit-dark" style={{ display: 'inline-block' }}>
        <span className="txkit-tb" data-state="ready" style={{ opacity: 0.5 }}>
          <span className="txkit-tb-amount">0.0000 ETH</span>
          <span className="txkit-tb-fiat">$0.00</span>
        </span>
      </div>
    </StorySection>
  </>
)


export default PreviewTab
