const DotLoadingDemo = () => (
  <div
    className="txkit-root txkit-dark"
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


export default DotLoadingDemo
