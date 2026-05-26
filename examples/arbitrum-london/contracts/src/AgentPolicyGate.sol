// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AgentPolicyGate
 * @notice Minimum-viable policy gate that enforces three checks before executing
 *         an envelope on behalf of an autonomous agent:
 *         1. The envelope hash is signed by the configured agent signer (ECDSA).
 *         2. The destination contract is on the allow-list.
 *         3. The msg.value is at or below the configured spend limit.
 *         Replay protection is enforced by marking each envelope hash as used.
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
contract AgentPolicyGate is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

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
    error ExecutionFailed(bytes returnData);

    constructor(address initialOwner, address initialAgentSigner) Ownable(initialOwner) {
        if (initialAgentSigner == address(0)) {
            revert AgentSignerNotSet();
        }
        agentSigner = initialAgentSigner;
        emit AgentSignerSet(address(0), initialAgentSigner);
    }

    /**
     * @notice Execute a transaction whose envelope was signed by the agent signer.
     * @param envelopeHash The hash of the off-chain envelope (kept opaque on-chain).
     * @param signature ECDSA signature over `envelopeHash` (Ethereum signed message prefix applied).
     * @param to Destination contract for the inner call.
     * @param data Calldata for the inner call.
     * @param value ETH value to forward. Must be at or below `spendLimit`.
     */
    function executeEnvelope(
        bytes32 envelopeHash,
        bytes calldata signature,
        address to,
        bytes calldata data,
        uint256 value
    ) external payable returns (bytes memory returnData) {
        if (usedEnvelopes[envelopeHash]) {
            revert EnvelopeAlreadyUsed(envelopeHash);
        }
        if (!allowedRecipients[to]) {
            revert RecipientNotAllowed(to);
        }
        if (value > spendLimit) {
            revert SpendLimitExceeded(value, spendLimit);
        }

        bytes32 ethSignedHash = envelopeHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        if (recovered != agentSigner) {
            revert InvalidSignature();
        }

        // Mark used before external call - check-effects-interactions.
        usedEnvelopes[envelopeHash] = true;

        (bool ok, bytes memory result) = to.call{ value: value }(data);
        if (!ok) {
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

    /// @notice Accept native value when an envelope forwards ETH to msg.sender prefunding.
    receive() external payable { }
}
