import React from 'react'


const VariantButton: React.FC<{
  label?: string
  size?: 'default' | 'compact'
  variant?: string
}> = ({ label = 'Connect Wallet', size = 'default', variant = 'default' }) => (
  <div className="txkit-cw" data-size={size} data-variant={variant}>
    <button
      type="button"
      className="txkit-cw-button"
      data-state="disconnected"
    >
      <span>{label}</span>
    </button>
  </div>
)


export default VariantButton
