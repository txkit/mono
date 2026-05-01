import React from 'react'

import BoolField from '../BoolField'
import ArrayField from '../ArrayField'
import BytesField from '../BytesField'
import TupleField from '../TupleField'
import StringField from '../StringField'
import AddressField from '../AddressField'
import IntegerField from '../IntegerField'
import UnsupportedField from '../UnsupportedField'
import type { FieldProps } from '../ContractFormFields'
import type { ContractFormLabels } from '../labels'


type FieldInputProps = FieldProps & {
  labels: ContractFormLabels
}


const FieldInput: React.FC<FieldInputProps> = ({ labels, ...props }) => {
  switch (props.field.fieldType) {
    case 'address':
      return <AddressField {...props} />
    case 'uint':
    case 'int':
      return <IntegerField {...props} />
    case 'bool':
      return <BoolField {...props} />
    case 'string':
      return <StringField {...props} />
    case 'bytes':
    case 'bytesN':
      return <BytesField {...props} />
    case 'array':
    case 'tupleArray':
      return <ArrayField {...props} />
    case 'tuple':
      return <TupleField {...props} />
    default:
      return <UnsupportedField labels={labels} />
  }
}


export default FieldInput
export type { FieldInputProps }
