import { keccak256, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'


/**
 * EIP-712 signing helper for AgentPolicyGate envelope binding.
 *
 * Pairs with examples/arbitrum-london/contracts/src/AgentPolicyGate.sol:
 *
 *   bytes32 public constant EXECUTE_ENVELOPE_TYPEHASH = keccak256(
 *     "ExecuteEnvelope(bytes32 envelopeHash,address to,bytes32 dataHash,uint256 value)"
 *   );
 *
 * On-chain recovery (executeEnvelope path):
 *
 *   bytes32 digest = _hashTypedDataV4(
 *     keccak256(abi.encode(EXECUTE_ENVELOPE_TYPEHASH, envelopeHash, to, keccak256(data), value))
 *   );
 *   if (ECDSA.recover(digest, signature) != agentSigner) revert InvalidSignature();
 *
 * Domain separator binds the signature to (chainId, gate address), so a
 * signature for chain 421614 + gate A cannot be replayed on chain 46630 + gate B.
 *
 * Off-chain we use viem signTypedData which computes the identical
 * EIP-712 digest under the hood - the agent never re-implements the hash.
 */

export const AGENT_POLICY_GATE_EIP712_DOMAIN_NAME = 'AgentPolicyGate' as const
export const AGENT_POLICY_GATE_EIP712_DOMAIN_VERSION = '1' as const

const EXECUTE_ENVELOPE_TYPES = {
  ExecuteEnvelope: [
    { name: 'envelopeHash', type: 'bytes32' },
    { name: 'to', type: 'address' },
    { name: 'dataHash', type: 'bytes32' },
    { name: 'value', type: 'uint256' },
  ],
} as const

export type SignEnvelopeArgs = {
  envelopeHash: Hex,
  to: `0x${string}`,
  data: Hex,
  value: bigint,
  chainId: number,
  gateAddress: `0x${string}`,
  signerPrivateKey: Hex,
}

/**
 * Sign an envelope's EIP-712 digest with the agent signer key. Returns
 * the 65-byte ECDSA signature. The caller embeds this signature in the
 * outer executeEnvelope call data before returning the envelope to the
 * client.
 */
export const signEnvelope = async (args: SignEnvelopeArgs): Promise<Hex> => {
  const account = privateKeyToAccount(args.signerPrivateKey)
  const dataHash = keccak256(args.data)

  const signature = await account.signTypedData({
    domain: {
      name: AGENT_POLICY_GATE_EIP712_DOMAIN_NAME,
      version: AGENT_POLICY_GATE_EIP712_DOMAIN_VERSION,
      chainId: args.chainId,
      verifyingContract: args.gateAddress,
    },
    types: EXECUTE_ENVELOPE_TYPES,
    primaryType: 'ExecuteEnvelope',
    message: {
      envelopeHash: args.envelopeHash,
      to: args.to,
      dataHash,
      value: args.value,
    },
  })

  return signature
}
