'use client'
import React from 'react'

import RowContent from './RowContent'
import InlineContent from './InlineContent'
import type { TokenBalanceDefaultProps } from '../../types/balance'


const TokenBalanceDefault: React.FC<TokenBalanceDefaultProps> = (props) => {
  return props.variant === 'row'
    ? <RowContent {...props} />
    : <InlineContent {...props} />
}


export default TokenBalanceDefault
