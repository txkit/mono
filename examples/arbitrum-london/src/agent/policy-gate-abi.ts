/**
 * AgentPolicyGate ABI used by the Buildathon demo. Mirrors the EIP-712
 * binding shape in examples/arbitrum-london/contracts/src/AgentPolicyGate.sol.
 *
 * Single source of truth lives in the Solidity contract; this file is the
 * client + server bridge. When the Solidity surface changes we regenerate
 * this constant manually (no codegen for the demo).
 */
export const AGENT_POLICY_GATE_ABI = [
  {
    type: 'function',
    name: 'executeEnvelope',
    stateMutability: 'payable',
    inputs: [
      { name: 'envelopeHash', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
      { name: 'to', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: 'returnData', type: 'bytes' }],
  },
  {
    type: 'function',
    name: 'hashExecuteEnvelope',
    stateMutability: 'view',
    inputs: [
      { name: 'envelopeHash', type: 'bytes32' },
      { name: 'to', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'DOMAIN_SEPARATOR',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'agentSigner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'spendLimit',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowedRecipients',
    stateMutability: 'view',
    inputs: [{ name: 'recipient', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'usedEnvelopes',
    stateMutability: 'view',
    inputs: [{ name: 'envelopeHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'EnvelopeExecuted',
    inputs: [
      { indexed: true, name: 'envelopeHash', type: 'bytes32' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
      { indexed: false, name: 'data', type: 'bytes' },
      { indexed: false, name: 'returnData', type: 'bytes' },
    ],
  },
] as const
