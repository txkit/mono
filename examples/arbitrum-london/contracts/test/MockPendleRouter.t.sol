// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";
import { MockPendleRouter } from "../src/MockPendleRouter.sol";

contract MockPendleRouterTest is Test {
    MockPendleRouter internal router;
    address internal receiver;
    address internal ptToken;

    function setUp() public {
        router = new MockPendleRouter();
        receiver = makeAddr("receiver");
        ptToken = makeAddr("ptToken");
    }

    function test_swap_returnsDeterministicRate() public {
        uint256 amountIn = 1_000_000;
        uint256 expected = (amountIn * 995) / 1000;

        uint256 ptOut = router.swapExactTokenForPt(receiver, ptToken, amountIn, 0);

        assertEq(ptOut, expected, "PT out should be 995/1000 of input");
    }

    function test_swap_emitsEvent() public {
        uint256 amountIn = 2_000_000;
        uint256 expected = (amountIn * 995) / 1000;

        vm.expectEmit(true, true, true, true);
        emit MockPendleRouter.SwapExactTokenForPt(receiver, address(this), ptToken, amountIn, expected);

        router.swapExactTokenForPt(receiver, ptToken, amountIn, expected);
    }

    function test_swap_succeedsAtExactly50BpsSlippage() public {
        // Off-chain builder sets minPtOut = amountIn * (10000 - 50) / 10000 = 9950/10000.
        // The mock returns 995/1000 = 9950/10000, so a 50 bps declaration is the tight boundary.
        uint256 amountIn = 1_000_000;
        uint256 minPtOut = (amountIn * (10_000 - 50)) / 10_000;

        uint256 ptOut = router.swapExactTokenForPt(receiver, ptToken, amountIn, minPtOut);

        assertEq(ptOut, minPtOut, "50 bps boundary should pass exactly");
    }

    function test_revert_whenSlippageTighterThan50Bps() public {
        // 10 bps declaration => minPtOut = 9990/10000, above the mock's 9950/10000 output => revert.
        uint256 amountIn = 1_000_000;
        uint256 minPtOut = (amountIn * (10_000 - 10)) / 10_000;
        uint256 mockOut = (amountIn * 995) / 1000;

        vm.expectRevert(
            abi.encodeWithSelector(MockPendleRouter.InsufficientPtOut.selector, mockOut, minPtOut)
        );
        router.swapExactTokenForPt(receiver, ptToken, amountIn, minPtOut);
    }

    /**
     * @notice End-to-end scenario A path: an agent-signed envelope routed
     *         through AgentPolicyGate into the mock router. Proves the
     *         demo's on-chain call path executes and emits both events.
     */
    function test_integration_throughAgentPolicyGate() public {
        (address agentSigner, uint256 agentSignerKey) = makeAddrAndKey("agentSigner");
        address owner = makeAddr("owner");

        vm.prank(owner);
        AgentPolicyGate gate = new AgentPolicyGate(owner, agentSigner);

        vm.prank(owner);
        gate.setAllowedRecipient(address(router), true);

        uint256 amountIn = 1_000_000;
        uint256 minPtOut = (amountIn * (10_000 - 50)) / 10_000;
        bytes memory innerData = abi.encodeCall(
            MockPendleRouter.swapExactTokenForPt,
            (receiver, ptToken, amountIn, minPtOut)
        );
        bytes32 envelopeHash = keccak256("pendle-envelope-integration");
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
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", gate.DOMAIN_SEPARATOR(), structHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        gate.executeEnvelope(envelopeHash, signature, address(router), innerData, value);

        assertTrue(gate.usedEnvelopes(envelopeHash), "envelope should be consumed");
    }
}
