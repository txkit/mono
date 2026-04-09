import React from 'react'


const ToastIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'success') {
    return (
      <svg className="txkit-ft-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg className="txkit-ft-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    )
  }
  return null
}


export default ToastIcon
