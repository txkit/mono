import { useTxkitThemeClass } from '../../components'


const DotLoadingDemo = () => {
  const txkitThemeClass = useTxkitThemeClass()
  return (
    <div
      className={`tx-root ${txkitThemeClass}`}
      style={{ display: 'inline-block' }}
    >
      <button
        type="button"
        className="tx-cw-button"
        data-state="connecting"
        disabled
        style={{ cursor: 'wait' }}
      >
        <span className="tx-cw-dots">
          <span className="tx-cw-dot" />
          <span className="tx-cw-dot" />
          <span className="tx-cw-dot" />
        </span>
        <span>Connecting</span>
      </button>
    </div>
  )
}


export default DotLoadingDemo
