import { hashGradient, hashPixelAvatar } from '../../helpers/hashColor'
import { useTxkitThemeClass } from '../../components'


const addresses = [
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xDEADBEEF00000000000000000000000000000000',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  '0x8888888888888888888888888888888888888888',
]


type AvatarProps = {
  address: string
  variant: 'gradient' | 'pixel'
}

const MockAvatar: React.FC<AvatarProps> = ({ address, variant }) => {
  if (variant === 'pixel') {
    const { pattern, background, foreground } = hashPixelAvatar(address)
    return (
      <span
        className="txkit-cw-avatar-fallback"
        style={{ background, width: 32, height: 32, overflow: 'hidden' }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 5 5" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
          {
            pattern.flatMap((row, rowIndex) => (
              row.map((filled, colIndex) => (
                filled
                  ? <rect key={`${rowIndex}-${colIndex}`} x={colIndex} y={rowIndex} width={1} height={1} fill={foreground} />
                  : null
              ))
            ))
          }
        </svg>
      </span>
    )
  }

  return (
    <span
      className="txkit-cw-avatar-fallback"
      style={{ background: hashGradient(address), width: 32, height: 32 }}
      aria-hidden="true"
    />
  )
}


const AvatarFallbackDemo = () => {
  const txkitThemeClass = useTxkitThemeClass()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {
        ([ 'gradient', 'pixel' ] as const).map((variant) => (
          <div key={variant} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ minWidth: 72, fontSize: 11, color: '#64748b', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {variant}
            </span>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {
                addresses.map((address) => (
                  <div
                    key={address}
                    className={`txkit-root ${txkitThemeClass}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <MockAvatar address={address} variant={variant} />
                    <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {address.slice(0, 8)}...
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        ))
      }
    </div>
  )
}


export default AvatarFallbackDemo
