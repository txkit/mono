import React, { useState } from 'react'
import { FlowToast } from '@txkit/react'

import useMockFlow from '../TransactionButton/useMockFlow'


type Terminal = 'completed' | 'error' | 'rejected' | 'canceled'
type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

type Props = {
  flowId: string
  terminal: Terminal
  label?: string
  position?: Position
  autoDismiss?: number
}

const ToastTrigger: React.FC<Props> = ({
  flowId,
  terminal,
  label = 'Trigger toast',
  position,
  autoDismiss,
}) => {
  // version=0 keeps the mocked flow at 'pending' (status idle, toast hidden)
  // until the first click. Each click bumps the counter so useMockFlow re-fires
  // its useEffect and writes a fresh entry to the store - the new reference
  // wakes FlowToast's listener, so a previously dismissed toast re-shows.
  const [ version, setVersion ] = useState(0)
  const activeState = version === 0 ? 'pending' : terminal

  useMockFlow({ activeState, flowId, stepsCount: 2, version })

  return (
    <>
      <button
        type="button"
        className="story-toast-trigger"
        onClick={() => setVersion((value) => value + 1)}
      >
        {label}
      </button>
      <FlowToast flowId={flowId} position={position} autoDismiss={autoDismiss} />
    </>
  )
}


export default ToastTrigger
