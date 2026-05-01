import React from 'react'

import type { ContractFormLabels } from '../labels'


const UnsupportedField: React.FC<{ labels: ContractFormLabels }> = ({ labels }) => (
  <div className="tx-cf-unsupported">
    {labels.unsupportedType}
  </div>
)


export default UnsupportedField
