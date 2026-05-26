// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";

contract AgentPolicyGateTest is Test {
    using MessageHashUtils for bytes32;

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

        // Fund the gate so it can forward value.
        vm.deal(address(gate), 10 ether);
    }

    function _sign(bytes32 envelopeHash) internal view returns (bytes memory) {
        bytes32 ethSignedHash = envelopeHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentSignerKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    function test_happyPath_executesAndEmits() public {
        bytes32 envelopeHash = keccak256("envelope-1");
        bytes memory signature = _sign(envelopeHash);
        bytes memory data = abi.encodeWithSignature("noop()");

        vm.expectEmit(true, true, false, true);
        emit AgentPolicyGate.EnvelopeExecuted(envelopeHash, allowedTarget, 0, data, "");

        gate.executeEnvelope(envelopeHash, signature, allowedTarget, data, 0);

        assertTrue(gate.usedEnvelopes(envelopeHash), "envelope should be marked used");
    }

    function test_reverts_whenSignatureIsForOtherSigner() public {
        bytes32 envelopeHash = keccak256("envelope-2");
        // Sign with a stranger - should be rejected.
        (, uint256 strangerKey) = makeAddrAndKey("stranger");
        bytes32 ethSignedHash = envelopeHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(strangerKey, ethSignedHash);
        bytes memory badSignature = abi.encodePacked(r, s, v);

        vm.expectRevert(AgentPolicyGate.InvalidSignature.selector);
        gate.executeEnvelope(envelopeHash, badSignature, allowedTarget, "", 0);
    }

    function test_reverts_whenRecipientNotAllowed() public {
        bytes32 envelopeHash = keccak256("envelope-3");
        bytes memory signature = _sign(envelopeHash);

        vm.expectRevert(abi.encodeWithSelector(AgentPolicyGate.RecipientNotAllowed.selector, unrelated));
        gate.executeEnvelope(envelopeHash, signature, unrelated, "", 0);
    }

    function test_reverts_whenValueExceedsLimit() public {
        bytes32 envelopeHash = keccak256("envelope-4");
        bytes memory signature = _sign(envelopeHash);

        vm.expectRevert(abi.encodeWithSelector(AgentPolicyGate.SpendLimitExceeded.selector, 2 ether, 1 ether));
        gate.executeEnvelope(envelopeHash, signature, allowedTarget, "", 2 ether);
    }

    function test_reverts_whenEnvelopeAlreadyUsed() public {
        bytes32 envelopeHash = keccak256("envelope-5");
        bytes memory signature = _sign(envelopeHash);

        gate.executeEnvelope(envelopeHash, signature, allowedTarget, "", 0);

        vm.expectRevert(abi.encodeWithSelector(AgentPolicyGate.EnvelopeAlreadyUsed.selector, envelopeHash));
        gate.executeEnvelope(envelopeHash, signature, allowedTarget, "", 0);
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
        vm.expectRevert();
        vm.prank(unrelated);
        gate.setSpendLimit(5 ether);
    }
}
