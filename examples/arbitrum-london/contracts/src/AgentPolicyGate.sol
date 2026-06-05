// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title AgentPolicyGate
 * @notice Minimum-viable policy gate that enforces five checks before executing
 *         an envelope on behalf of an autonomous agent:
 *         1. The forwarded msg.value matches the declared envelope value
 *            (prevents balance-drain via mismatched value parameter).
 *         2. The envelope has not been executed before (replay protection).
 *         3. The destination contract is on the allow-list.
 *         4. The declared value is at or below the configured spend limit.
 *         5. The EIP-712 typed-data digest binding
 *            (envelopeHash, to, keccak256(data), value) - implicitly chain-id
 *            and contract-bound via the EIP-712 domain separator - is signed
 *            by the configured agent signer.
 *
 *         The EIP-712 binding prevents replay across (a) different (to, data,
 *         value) tuples for the same envelope hash, (b) different chains, and
 *         (c) other contract instances. Without this binding a stolen
 *         (envelopeHash, signature) pair could be re-targeted by an attacker.
 *
 *         This is the demo policy gate for the txKit Arbitrum London Buildathon
 *         scenarios. It binds the Prepared Transaction Envelope (ERC-8265 PR
 *         #1753) shape to an on-chain policy enforcement point.
 *
 * @dev Out of scope (v0.1, demo only):
 *      - per-recipient spend limits (single global limit only)
 *      - rolling-window aggregate spend tracking
 *      - revocable allow-list with reason codes
 *      - multi-signer thresholds
 *      Any of these would warrant a separate audit pass before mainnet.
 */
contract AgentPolicyGate is Ownable, EIP712 {
    using ECDSA for bytes32;

    /// @notice EIP-712 type hash for the ExecuteEnvelope authorisation payload.
    bytes32 public constant EXECUTE_ENVELOPE_TYPEHASH = keccak256(
        "ExecuteEnvelope(bytes32 envelopeHash,address to,bytes32 dataHash,uint256 value)"
    );

    /// @notice Address authorised to sign envelopes for this gate. Set by owner.
    address public agentSigner;

    /// @notice Single global per-call cap on the ETH value forwarded. 0 disables value forwarding.
    uint256 public spendLimit;

    /// @notice Contract destinations approved for envelope execution.
    mapping(address recipient => bool allowed) public allowedRecipients;

    /// @notice Envelope hashes already executed - used for replay protection.
    mapping(bytes32 envelopeHash => bool used) public usedEnvelopes;

    event AgentSignerSet(address indexed previousSigner, address indexed newSigner);
    event SpendLimitSet(uint256 previousLimit, uint256 newLimit);
    event AllowedRecipientSet(address indexed recipient, bool allowed);
    event EnvelopeExecuted(
        bytes32 indexed envelopeHash,
        address indexed to,
        uint256 value,
        bytes data,
        bytes returnData
    );

    error InvalidSignature();
    error RecipientNotAllowed(address recipient);
    error SpendLimitExceeded(uint256 requested, uint256 limit);
    error EnvelopeAlreadyUsed(bytes32 envelopeHash);
    error AgentSignerNotSet();
    error ValueMismatch(uint256 msgValue, uint256 declaredValue);
    error ExecutionFailed(bytes returnData);

    constructor(address initialOwner, address initialAgentSigner)
        Ownable(initialOwner)
        EIP712("AgentPolicyGate", "1")
    {
        if (initialAgentSigner == address(0)) {
            revert AgentSignerNotSet();
        }
        agentSigner = initialAgentSigner;
        emit AgentSignerSet(address(0), initialAgentSigner);
    }

    /**
     * @notice Public EIP-712 domain separator helper for off-chain signing tools.
     * @return The current EIP-712 domain separator for this contract instance.
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Compute the EIP-712 digest the agent signer must sign for a given
     *         (envelopeHash, to, data, value) tuple. Exposed for off-chain tooling.
     */
    function hashExecuteEnvelope(
        bytes32 envelopeHash,
        address to,
        bytes calldata data,
        uint256 value
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(EXECUTE_ENVELOPE_TYPEHASH, envelopeHash, to, keccak256(data), value)
        );
        return _hashTypedDataV4(structHash);
    }

    /**
     * @notice Execute a transaction whose envelope was signed by the agent signer.
     * @param envelopeHash Opaque off-chain envelope identifier (also used for replay protection).
     * @param signature EIP-712 ECDSA signature over the ExecuteEnvelope struct.
     * @param to Destination contract for the inner call.
     * @param data Calldata for the inner call.
     * @param value ETH value to forward. MUST equal `msg.value` and be at or below `spendLimit`.
     * @return returnData Raw bytes returned by the inner call.
     */
    function executeEnvelope(
        bytes32 envelopeHash,
        bytes calldata signature,
        address to,
        bytes calldata data,
        uint256 value
    ) external payable returns (bytes memory returnData) {
        if (msg.value != value) {
            revert ValueMismatch(msg.value, value);
        }
        if (usedEnvelopes[envelopeHash]) {
            revert EnvelopeAlreadyUsed(envelopeHash);
        }
        if (!allowedRecipients[to]) {
            revert RecipientNotAllowed(to);
        }
        if (value > spendLimit) {
            revert SpendLimitExceeded(value, spendLimit);
        }

        bytes32 structHash = keccak256(
            abi.encode(EXECUTE_ENVELOPE_TYPEHASH, envelopeHash, to, keccak256(data), value)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        if (recovered != agentSigner) {
            revert InvalidSignature();
        }

        // Mark used before external call - check-effects-interactions.
        usedEnvelopes[envelopeHash] = true;

        (bool success, bytes memory result) = to.call{ value: value }(data);
        if (!success) {
            revert ExecutionFailed(result);
        }

        emit EnvelopeExecuted(envelopeHash, to, value, data, result);
        return result;
    }

    /// @notice Update the agent signer. Owner only.
    function setAgentSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) {
            revert AgentSignerNotSet();
        }
        address previous = agentSigner;
        agentSigner = newSigner;
        emit AgentSignerSet(previous, newSigner);
    }

    /// @notice Update the per-call spend limit. Owner only.
    function setSpendLimit(uint256 newLimit) external onlyOwner {
        uint256 previous = spendLimit;
        spendLimit = newLimit;
        emit SpendLimitSet(previous, newLimit);
    }

    /// @notice Toggle a recipient on the allow-list. Owner only.
    function setAllowedRecipient(address recipient, bool allowed) external onlyOwner {
        allowedRecipients[recipient] = allowed;
        emit AllowedRecipientSet(recipient, allowed);
    }
}
