import hashColor from '../shared/hashColor'


const AvatarFallbackDemo = () => {
  const addresses = [
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xDEADBEEF00000000000000000000000000000000',
  ]

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {
        addresses.map((address) => (
          <div
            key={address}
            className="txkit-root txkit-dark"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span
              className="txkit-cw-avatar-fallback"
              style={{ backgroundColor: hashColor(address) }}
            >
              {address.slice(2, 4).toUpperCase()}
            </span>
            <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              {address.slice(0, 8)}...
            </span>
          </div>
        ))
      }
    </div>
  )
}


export default AvatarFallbackDemo
