import WalletMetamask from '@web3icons/react/icons/wallets/WalletMetamask'
import WalletPhantom from '@web3icons/react/icons/wallets/WalletPhantom'
import WalletRabby from '@web3icons/react/icons/wallets/WalletRabby'
import WalletSafe from '@web3icons/react/icons/wallets/WalletSafe'
import WalletCoinbase from '@web3icons/react/icons/wallets/WalletCoinbase'
import WalletRainbow from '@web3icons/react/icons/wallets/WalletRainbow'
import NetworkSui from '@web3icons/react/icons/networks/NetworkSui'
import NetworkArbitrumOne from '@web3icons/react/icons/networks/NetworkArbitrumOne'
import NetworkPolygon from '@web3icons/react/icons/networks/NetworkPolygon'
import NetworkOptimism from '@web3icons/react/icons/networks/NetworkOptimism'
import NetworkEthereum from '@web3icons/react/icons/networks/NetworkEthereum'
import TokenAAVE from '@web3icons/react/icons/tokens/TokenAAVE'
import ExchangeUniswap from '@web3icons/react/icons/exchanges/ExchangeUniswap'
import Exchange1inch from '@web3icons/react/icons/exchanges/Exchange1inch'
import ExchangeCowswap from '@web3icons/react/icons/exchanges/ExchangeCowswap'
import ExchangeHyperliquid from '@web3icons/react/icons/exchanges/ExchangeHyperliquid'


// 16-slot logo wall, all real brand SVGs from @web3icons/react.
// Brands not in the icon set (Morpho, LI.FI, Crossmint, x402) are
// replaced with same-category integration anchors that ARE shipped
// (DEX/aggregator/MEV-aware/perp). Wall reads as one coherent grid
// of recognizable Web3 marks.

type Tile = {
  id: string,
  label: string,
  Icon: React.ComponentType<{ size?: number, variant?: 'mono' | 'branded' }>,
}

const TILES: Tile[] = [
  { id: 'metamask', label: 'MetaMask', Icon: WalletMetamask },
  { id: 'phantom', label: 'Phantom', Icon: WalletPhantom },
  { id: 'rabby', label: 'Rabby', Icon: WalletRabby },
  { id: 'safe', label: 'Safe', Icon: WalletSafe },
  { id: 'coinbase', label: 'Coinbase', Icon: WalletCoinbase },
  { id: 'rainbow', label: 'Rainbow', Icon: WalletRainbow },
  { id: 'sui', label: 'Sui / Mysten', Icon: NetworkSui },
  { id: 'arbitrum', label: 'Arbitrum', Icon: NetworkArbitrumOne },
  { id: 'polygon', label: 'Polygon', Icon: NetworkPolygon },
  { id: 'optimism', label: 'Optimism', Icon: NetworkOptimism },
  { id: 'ethereum', label: 'Ethereum', Icon: NetworkEthereum },
  { id: 'aave', label: 'Aave', Icon: TokenAAVE },
  { id: 'uniswap', label: 'Uniswap', Icon: ExchangeUniswap },
  { id: '1inch', label: '1inch', Icon: Exchange1inch },
  { id: 'cowswap', label: 'CowSwap', Icon: ExchangeCowswap },
  { id: 'hyperliquid', label: 'Hyperliquid', Icon: ExchangeHyperliquid },
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
        <tile.Icon size={ ICON_SIZE } variant="branded" />
      </div>
    )) }
  </div>
)


export default LogoWall
