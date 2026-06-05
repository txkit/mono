// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

/**
 * @title MockPendleRouter
 * @notice Deterministic stand-in for a Pendle router, used only by the txKit
 *         Arbitrum London Buildathon demo (scenario A). It does NOT move any
 *         ERC-20 tokens - it computes a fixed-rate PT amount, emits an event,
 *         and returns the amount, so the agent -> AgentPolicyGate -> router
 *         call path can execute end-to-end on a testnet without funding the
 *         caller with real input tokens.
 *
 *         Conversion is a fixed 1:0.995 (a flat 50 bps haircut), matching the
 *         off-chain `buildPendleEnvelope` minPtOut math in
 *         examples/arbitrum-london/src/agent/envelope-builder.ts: any declared
 *         slippage of 50 bps or looser succeeds, anything tighter reverts with
 *         InsufficientPtOut - the same shape a real router would use.
 *
 * @dev Out of scope (demo only): real token custody, dynamic pricing, PT
 *      minting, maturity logic. None of these are needed to demonstrate the
 *      envelope review-and-sign flow, and adding them would obscure it.
 */
contract MockPendleRouter {
    /// @notice Numerator of the deterministic input->PT conversion rate.
    uint256 public constant RATE_NUMERATOR = 995;
    /// @notice Denominator of the deterministic input->PT conversion rate.
    uint256 public constant RATE_DENOMINATOR = 1000;

    error InsufficientPtOut(uint256 ptOut, uint256 minPtOut);

    event SwapExactTokenForPt(
        address indexed receiver,
        address indexed caller,
        address indexed ptOut,
        uint256 amountIn,
        uint256 ptOutReturned
    );

    /**
     * @notice Swap an exact input amount for a deterministic PT amount.
     * @param receiver Address credited with the PT output (event only - no real transfer in the mock).
     * @param ptOut The PT token the caller wants (event only - the mock is token-agnostic).
     * @param amountIn Input amount in raw token units.
     * @param minPtOut Minimum acceptable PT out; reverts if the fixed-rate output is below it.
     * @return ptOutReturned The deterministic PT amount (amountIn * 995 / 1000).
     */
    function swapExactTokenForPt(
        address receiver,
        address ptOut,
        uint256 amountIn,
        uint256 minPtOut
    ) external returns (uint256 ptOutReturned) {
        ptOutReturned = (amountIn * RATE_NUMERATOR) / RATE_DENOMINATOR;
        if (ptOutReturned < minPtOut) {
            revert InsufficientPtOut(ptOutReturned, minPtOut);
        }

        emit SwapExactTokenForPt(receiver, msg.sender, ptOut, amountIn, ptOutReturned);
        return ptOutReturned;
    }
}
