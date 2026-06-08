// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

/**
 * @title MockRwaRouter
 * @notice Deterministic stand-in for an RWA brokerage router, used only by the
 *         txKit Arbitrum London Buildathon demo (scenario C) on Robinhood Chain
 *         testnet. It does NOT custody or transfer real tokens - it credits an
 *         internal holdings ledger and emits an event, so the agent ->
 *         AgentPolicyGate -> router call path executes end to end on a testnet
 *         (or anvil) without funding the caller with real stock tokens.
 *
 * @dev Out of scope (demo only): real token custody, settlement against the
 *      faucet-issued stock tokens, pricing, dividends. Moving real faucet
 *      TSLA/AMZN/PLTR is a Robinhood-only upgrade, not needed to demonstrate
 *      the envelope review-and-sign flow.
 */
contract MockRwaRouter {
    /// @notice receiver => ticker (bytes32) => accumulated mock holding.
    mapping(address receiver => mapping(bytes32 ticker => uint256 amount)) public holdings;

    error ZeroAmount();

    event RwaPurchased(
        address indexed receiver,
        address indexed caller,
        bytes32 indexed ticker,
        uint256 amount
    );

    /**
     * @notice Buy a mock RWA position.
     * @param receiver Address credited with the mock holding.
     * @param ticker Asset ticker as bytes32 (e.g. bytes32("TSLA")).
     * @param amount Whole-token quantity (mock units).
     */
    function buy(address receiver, bytes32 ticker, uint256 amount) external {
        if (amount == 0) {
            revert ZeroAmount();
        }
        holdings[receiver][ticker] += amount;
        emit RwaPurchased(receiver, msg.sender, ticker, amount);
    }
}
