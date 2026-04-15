import { useTxkitThemeClass } from '../../components'


const DotLoadingDemo = () => {
  const txkitThemeClass = useTxkitThemeClass()
  return (
    <div
      className={`txkit-root ${txkitThemeClass}`}
      style={{ display: 'inline-block' }}
    >
      <button
        type="button"
        className="txkit-cw-button"
        data-state="connecting"
        disabled
        style={{ cursor: 'wait' }}
      >
        <span className="txkit-cw-dots">
          <span className="txkit-cw-dot" />
          <span className="txkit-cw-dot" />
          <span className="txkit-cw-dot" />
        </span>
        <span>Connecting</span>
      </button>
    </div>
  )
}


export default DotLoadingDemo
