// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";

contract AgentPolicyGateTest is Test {
    AgentPolicyGate internal gate;
    address internal owner;
    address internal agentSigner;
    uint256 internal agentSignerKey;
    address internal allowedTarget;
    address internal unrelated;

    function setUp() public {
        owner = makeAddr("owner");
        (agentSigner, agentSignerKey) = makeAddrAndKey("agentSigner");
        allowedTarget = makeAddr("allowedTarget");
        unrelated = makeAddr("unrelated");

        vm.prank(owner);
        gate = new AgentPolicyGate(owner, agentSigner);

        vm.startPrank(owner);
        gate.setAllowedRecipient(allowedTarget, true);
        gate.setSpendLimit(1 ether);
        vm.stopPrank();
    }

    function _sign(
        bytes32 envelopeHash,
        address to,
        bytes memory data,
        uint256 value
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                gate.EXECUTE_ENVELOPE_TYPEHASH(),
                envelopeHash,
                to,
                keccak256(data),
                value
            )
        );
        bytes32 domainSeparator = gate.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentSignerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_happyPath_executesAndEmits() public {
        bytes32 envelopeHash = keccak256("envelope-1");
        bytes memory data = abi.encodeWithSignature("noop()");
        uint256 value = 0;
        bytes memory signature = _sign(envelopeHash, allowedTarget, data, value);

        vm.expectEmit(true, true, false, true);
        emit AgentPolicyGate.EnvelopeExecuted(envelopeHash, allowedTarget, value, data, "");

        gate.executeEnvelope{ value: value }(envelopeHash, signature, allowedTarget, data, value);

        assertTrue(gate.usedEnvelopes(envelopeHash), "envelope should be marked used");
    }

    function test_happyPath_forwardsMsgValueToTarget() public {
        bytes32 envelopeHash = keccak256("envelope-forward");
        bytes memory data = "";
        uint256 value = 0.5 ether;
        bytes memory signature = _sign(envelopeHash, allowedTarget, data, value);

        // Fund this test contract so we can attach msg.value.
        vm.deal(address(this), 1 ether);

        uint256 targetBalanceBefore = allowedTarget.balance;
        gate.executeEnvelope{ value: value }(envelopeHash, signature, allowedTarget, data, value);

        assertEq(
            allowedTarget.balance - targetBalanceBefore,
            value,
            "msg.value should be forwarded to target"
        );
        assertEq(address(gate).balance, 0, "gate should hold no residual balance");
    }

    function test_reverts_whenMsgValueLessThanDeclared() public {
        bytes32 envelopeHash = keccak256("envelope-mismatch-low");
        bytes memory data = "";
        uint256 declaredValue = 0.5 ether;
        bytes memory signature = _sign(envelopeHash, allowedTarget, data, declaredValue);

        // Declare 0.5 ETH but attach 0 - should revert.
        vm.expectRevert(
            abi.encodeWithSelector(AgentPolicyGate.ValueMismatch.selector, 0, declaredValue)
        );
        gate.executeEnvelope{ value: 0 }(envelopeHash, signature, allowedTarget, data, declaredValue);
    }

    function test_reverts_whenMsgValueGreaterThanDeclared() public {
        bytes32 envelopeHash = keccak256("envelope-mismatch-high");
        bytes memory data = "";
        uint256 declaredValue = 0;
        bytes memory signature = _sign(envelopeHash, allowedTarget, data, declaredValue);

        vm.deal(address(this), 1 ether);

        // Declare 0 but attach 0.1 ETH - should revert (would otherwise trap ETH).
        vm.expectRevert(
            abi.encodeWithSelector(AgentPolicyGate.ValueMismatch.selector, 0.1 ether, declaredValue)
        );
        gate.executeEnvelope{ value: 0.1 ether }(envelopeHash, signature, allowedTarget, data, declaredValue);
    }

    function test_reverts_whenSignatureIsForOtherSigner() public {
        bytes32 envelopeHash = keccak256("envelope-2");
        bytes memory data = "";
        uint256 value = 0;
        // Sign with a stranger - should be rejected.
        (, uint256 strangerKey) = makeAddrAndKey("stranger");
        bytes32 structHash = keccak256(
            abi.encode(
                gate.EXECUTE_ENVELOPE_TYPEHASH(),
                envelopeHash,
                allowedTarget,
                keccak256(data),
                value
            )
        );
        bytes32 domainSeparator = gate.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(strangerKey, digest);
        bytes memory badSignature = abi.encodePacked(r, s, v);

        vm.expectRevert(AgentPolicyGate.InvalidSignature.selector);
        gate.executeEnvelope{ value: 0 }(envelopeHash, badSignature, allowedTarget, data, value);
    }

    function test_reverts_whenAttackerRetargetsSignedEnvelope() public {
        // Demonstrates the EIP-712 binding: a signature for allowedTarget
        // cannot be replayed against a different target, even if the new
        // target is also on the allow-list.
        bytes32 envelopeHash = keccak256("envelope-retarget");
        bytes memory data = "";
        uint256 value = 0;
        bytes memory signature = _sign(envelopeHash, allowedTarget, data, value);

        // Allow-list a second target so the test exercises the signature
        // check rather than the allow-list check.
        vm.prank(owner);
        gate.setAllowedRecipient(unrelated, true);

        vm.expectRevert(AgentPolicyGate.InvalidSignature.selector);
        gate.executeEnvelope{ value: 0 }(envelopeHash, signature, unrelated, data, value);
    }

    function test_reverts_whenAttackerSwapsCalldata() public {
        // Demonstrates EIP-712 binding to keccak256(data): signature for
        // empty data does not validate against attacker-chosen calldata.
        bytes32 envelopeHash = keccak256("envelope-swap-data");
        bytes memory originalData = "";
        uint256 value = 0;
        bytes memory signature = _sign(envelopeHash, allowedTarget, originalData, value);

        bytes memory tamperedData = abi.encodeWithSignature("drain(address)", unrelated);

        vm.expectRevert(AgentPolicyGate.InvalidSignature.selector);
        gate.executeEnvelope{ value: 0 }(envelopeHash, signature, allowedTarget, tamperedData, value);
    }

    function test_reverts_whenRecipientNotAllowed() public {
        bytes32 envelopeHash = keccak256("envelope-3");
        bytes memory data = "";
        uint256 value = 0;
        bytes memory signature = _sign(envelopeHash, unrelated, data, value);

        vm.expectRevert(
            abi.encodeWithSelector(AgentPolicyGate.RecipientNotAllowed.selector, unrelated)
        );
        gate.executeEnvelope{ value: 0 }(envelopeHash, signature, unrelated, data, value);
    }

    function test_reverts_whenValueExceedsLimit() public {
        bytes32 envelopeHash = keccak256("envelope-4");
        bytes memory data = "";
        uint256 value = 2 ether;
        bytes memory signature = _sign(envelopeHash, allowedTarget, data, value);

        vm.deal(address(this), value);

        vm.expectRevert(
            abi.encodeWithSelector(AgentPolicyGate.SpendLimitExceeded.selector, value, 1 ether)
        );
        gate.executeEnvelope{ value: value }(envelopeHash, signature, allowedTarget, data, value);
    }

    function test_reverts_whenEnvelopeAlreadyUsed() public {
        bytes32 envelopeHash = keccak256("envelope-5");
        bytes memory data = "";
        uint256 value = 0;
        bytes memory signature = _sign(envelopeHash, allowedTarget, data, value);

        gate.executeEnvelope{ value: 0 }(envelopeHash, signature, allowedTarget, data, value);

        vm.expectRevert(
            abi.encodeWithSelector(AgentPolicyGate.EnvelopeAlreadyUsed.selector, envelopeHash)
        );
        gate.executeEnvelope{ value: 0 }(envelopeHash, signature, allowedTarget, data, value);
    }

    function test_setAgentSigner_emitsAndUpdates() public {
        address newSigner = makeAddr("newSigner");

        vm.expectEmit(true, true, false, true);
        emit AgentPolicyGate.AgentSignerSet(agentSigner, newSigner);

        vm.prank(owner);
        gate.setAgentSigner(newSigner);

        assertEq(gate.agentSigner(), newSigner);
    }

    function test_setAllowedRecipient_togglesOnAndOff() public {
        vm.prank(owner);
        gate.setAllowedRecipient(unrelated, true);
        assertTrue(gate.allowedRecipients(unrelated));

        vm.prank(owner);
        gate.setAllowedRecipient(unrelated, false);
        assertFalse(gate.allowedRecipients(unrelated));
    }

    function test_revert_setAgentSigner_zeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(AgentPolicyGate.AgentSignerNotSet.selector);
        gate.setAgentSigner(address(0));
    }

    function test_revert_onlyOwner_setSpendLimit() public {
        vm.prank(unrelated);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unrelated)
        );
        gate.setSpendLimit(5 ether);
    }

    function test_hashExecuteEnvelope_matchesOnChainDigest() public view {
        // Sanity: the hashExecuteEnvelope helper returns the same digest a
        // client must produce locally to sign. Catches accidental drift in
        // type-hash / domain-separator wiring.
        bytes32 envelopeHash = keccak256("envelope-hash-helper");
        bytes memory data = abi.encodeWithSignature("noop()");
        uint256 value = 0.25 ether;

        bytes32 structHash = keccak256(
            abi.encode(
                gate.EXECUTE_ENVELOPE_TYPEHASH(),
                envelopeHash,
                allowedTarget,
                keccak256(data),
                value
            )
        );
        bytes32 expected = keccak256(
            abi.encodePacked("\x19\x01", gate.DOMAIN_SEPARATOR(), structHash)
        );
        bytes32 actual = gate.hashExecuteEnvelope(envelopeHash, allowedTarget, data, value);
        assertEq(actual, expected);
    }

    receive() external payable { }
}
