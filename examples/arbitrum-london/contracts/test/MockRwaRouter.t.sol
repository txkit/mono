// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";
import { MockRwaRouter } from "../src/MockRwaRouter.sol";

contract MockRwaRouterTest is Test {
    MockRwaRouter internal router;
    address internal receiver;
    bytes32 internal ticker;

    function setUp() public {
        router = new MockRwaRouter();
        receiver = makeAddr("receiver");
        ticker = bytes32("TSLA");
    }

    function test_buy_recordsHolding() public {
        router.buy(receiver, ticker, 5);
        assertEq(router.holdings(receiver, ticker), 5, "holding should be credited");
    }

    function test_buy_accumulates() public {
        router.buy(receiver, ticker, 5);
        router.buy(receiver, ticker, 3);
        assertEq(router.holdings(receiver, ticker), 8, "holdings should accumulate");
    }

    function test_buy_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit MockRwaRouter.RwaPurchased(receiver, address(this), ticker, 5);
        router.buy(receiver, ticker, 5);
    }

    function test_revert_whenAmountZero() public {
        vm.expectRevert(MockRwaRouter.ZeroAmount.selector);
        router.buy(receiver, ticker, 0);
    }

    /**
     * @notice End-to-end scenario C path: an agent-signed envelope routed
     *         through AgentPolicyGate into the mock RWA router. Proves the
     *         demo's on-chain call path executes on chainId 46630.
     */
    function test_integration_throughAgentPolicyGate() public {
        (address agentSigner, uint256 agentSignerKey) = makeAddrAndKey("agentSigner");
        address owner = makeAddr("owner");

        vm.prank(owner);
        AgentPolicyGate gate = new AgentPolicyGate(owner, agentSigner);
        vm.prank(owner);
        gate.setAllowedRecipient(address(router), true);

        bytes memory innerData = abi.encodeCall(MockRwaRouter.buy, (receiver, ticker, 5));
        bytes32 envelopeHash = keccak256("rwa-envelope-integration");
        uint256 value = 0;

        bytes32 structHash = keccak256(
            abi.encode(
                gate.EXECUTE_ENVELOPE_TYPEHASH(),
                envelopeHash,
                address(router),
                keccak256(innerData),
                value
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", gate.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        gate.executeEnvelope(envelopeHash, signature, address(router), innerData, value);

        assertTrue(gate.usedEnvelopes(envelopeHash), "envelope should be consumed");
        assertEq(router.holdings(receiver, ticker), 5, "buy should execute through the gate");
    }
}
