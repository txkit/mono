import React, { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'


type PortalProps = {
  children: ReactNode
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  const [ mounted, setMounted ] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return createPortal(children, document.body)
}


export default Portal
