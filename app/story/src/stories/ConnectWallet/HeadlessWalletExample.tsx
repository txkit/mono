import { useWalletState } from '@txkit/react'


const HeadlessWalletExample = () => {
  const {
    state,
    address,
    connect,
    connectors,
    disconnect,
    displayAddress,
    formattedBalance,
  } = useWalletState()

  if (state === 'disconnected') {
    return (
      <div className="headless-wallet-buttons">
        {
          connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="headless-wallet-btn"
              onClick={() => connect({ connector })}
            >
              {connector.name}
            </button>
          ))
        }
      </div>
    )
  }

  if (state === 'connecting') {
    return <span>Connecting...</span>
  }

  return (
    <div>
      <div className="story-info-grid">
        <span className="story-info-key">State</span>
        <span className="story-info-value">{state}</span>
        <span className="story-info-key">Address</span>
        <span className="story-info-value" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{address}</span>
        <span className="story-info-key">Display</span>
        <span className="story-info-value">{displayAddress}</span>
        <span className="story-info-key">Balance</span>
        <span className="story-info-value">{formattedBalance}</span>
      </div>
      <div className="headless-tx-actions" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="headless-tx-btn headless-tx-btn--retry"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}


export default HeadlessWalletExample
