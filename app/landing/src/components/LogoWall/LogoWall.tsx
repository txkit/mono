import WalletMetamask from '@web3icons/react/icons/wallets/WalletMetamask'
import WalletPhantom from '@web3icons/react/icons/wallets/WalletPhantom'
import WalletRabby from '@web3icons/react/icons/wallets/WalletRabby'
import WalletSafe from '@web3icons/react/icons/wallets/WalletSafe'
import WalletCoinbase from '@web3icons/react/icons/wallets/WalletCoinbase'
import WalletWalletConnect from '@web3icons/react/icons/wallets/WalletWalletConnect'
import NetworkSui from '@web3icons/react/icons/networks/NetworkSui'
import NetworkArbitrumOne from '@web3icons/react/icons/networks/NetworkArbitrumOne'
import NetworkBase from '@web3icons/react/icons/networks/NetworkBase'
import NetworkOptimism from '@web3icons/react/icons/networks/NetworkOptimism'
import NetworkEthereum from '@web3icons/react/icons/networks/NetworkEthereum'
import TokenAAVE from '@web3icons/react/icons/tokens/TokenAAVE'


// 16-slot logo wall - mix of real Web3 brand SVGs from @web3icons/react +
// abstract tiles for brands not in the icon set (Morpho, LI.FI, Crossmint,
// x402). Tiles preserve visual rhythm so the wall reads as one coherent
// integration grid.

type Tile = {
  id: string,
  label: string,
  Icon?: React.ComponentType<{ size?: number, variant?: 'mono' | 'branded' }>,
  initial?: string,
  brandColor?: string,
}

const TILES: Tile[] = [
  { id: 'metamask', label: 'MetaMask', Icon: WalletMetamask },
  { id: 'phantom', label: 'Phantom', Icon: WalletPhantom },
  { id: 'rabby', label: 'Rabby', Icon: WalletRabby },
  { id: 'safe', label: 'Safe', Icon: WalletSafe },
  { id: 'coinbase', label: 'Coinbase', Icon: WalletCoinbase },
  { id: 'walletconnect', label: 'Reown', Icon: WalletWalletConnect },
  { id: 'sui', label: 'Sui / Mysten', Icon: NetworkSui },
  { id: 'arbitrum', label: 'Arbitrum', Icon: NetworkArbitrumOne },
  { id: 'base', label: 'Base', Icon: NetworkBase },
  { id: 'optimism', label: 'Optimism', Icon: NetworkOptimism },
  { id: 'ethereum', label: 'Ethereum', Icon: NetworkEthereum },
  { id: 'aave', label: 'Aave', Icon: TokenAAVE },
  { id: 'morpho', label: 'Morpho', initial: 'M', brandColor: '#3B82F6' },
  { id: 'lifi', label: 'LI.FI', initial: 'L', brandColor: '#FF7B7C' },
  { id: 'crossmint', label: 'Crossmint', initial: 'C', brandColor: '#00FFB7' },
  { id: 'x402', label: 'x402', initial: 'x', brandColor: '#0052FF' },
]

const ICON_SIZE = 32


const LogoWall = () => (
  <div className="logo-wall" role="list" aria-label="Integrations">
    { TILES.map((tile) => (
      <div
        key={ tile.id }
        className="logo-wall__tile"
        role="listitem"
        title={ tile.label }
      >
        { tile.Icon ? (
          <tile.Icon size={ ICON_SIZE } variant="branded" />
        ) : (
          <span
            className="logo-wall__initial"
            style={{ backgroundColor: tile.brandColor }}
          >
            { tile.initial }
          </span>
        ) }
      </div>
    )) }
  </div>
)


export default LogoWall
