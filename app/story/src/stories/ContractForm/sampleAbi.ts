const SAMPLE_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [ { name: '', type: 'bool' } ],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [ { name: '', type: 'bool' } ],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'multicall',
    stateMutability: 'payable',
    inputs: [
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [ { name: 'results', type: 'bytes[]' } ],
  },
  {
    type: 'function',
    name: 'registerUser',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'uint8' },
      { name: 'active', type: 'bool' },
      { name: 'referrer', type: 'address' },
    ],
    outputs: [],
  },
] as const


export default SAMPLE_ABI
