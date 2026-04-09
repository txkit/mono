'use client'
import React, { useState, type ReactNode } from 'react'

import { FlowStoreContext, createFlowStore } from './FlowContext'


type FlowProviderProps = {
  children: ReactNode
}


const FlowProvider: React.FC<FlowProviderProps> = ({ children }) => {
  const [ store ] = useState(createFlowStore)

  return (
    <FlowStoreContext.Provider value={store}>
      {children}
    </FlowStoreContext.Provider>
  )
}


export default FlowProvider
