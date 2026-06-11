// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

import { MockSettlementToken } from "./MockSettlementToken.sol";

/**
 * @title MockRwaRouter
 * @notice Deterministic stand-in for an RWA brokerage router, used only by the
 *         txKit Arbitrum London Buildathon demo (scenario C) on Robinhood Chain
 *         testnet. The stock side stays mock - it credits an internal holdings
 *         ledger and emits an event, so the agent -> AgentPolicyGate -> router
 *         call path executes end to end on a testnet (or anvil) without funding
 *         the caller with real stock tokens. The x402 settlement side is real:
 *         every buy moves one unit of a mock settlement token (pre-minted to
 *         this router at deploy) to the x402 merchant treasury, so the payment
 *         loop closes with a real on-chain ERC-20 Transfer receipt next to
 *         RwaPurchased. Amounts are mock-scale.
 *
 * @dev Out of scope (demo only): real equity custody, settlement against the
 *      faucet-issued stock tokens, pricing, dividends. Moving real faucet
 *      TSLA/AMZN/PLTR is a Robinhood-only upgrade, not needed to demonstrate
 *      the envelope review-and-sign flow.
 */
contract MockRwaRouter {
    /// @notice Mock x402 merchant treasury - mirrors X402_MERCHANT_ADDRESS in the demo facilitator.
    address public constant X402_TREASURY = 0x000000000000000000000000000000000000C402;

    /// @notice Settlement units moved to the treasury per executed buy (mock-scale).
    uint256 public constant SETTLEMENT_AMOUNT = 1;

    /// @notice Mock settlement token; the entire supply is pre-minted to this router at deploy.
    MockSettlementToken public immutable settlementToken;

    /// @notice receiver => ticker (bytes32) => accumulated mock holding.
    mapping(address receiver => mapping(bytes32 ticker => uint256 amount)) public holdings;

    error ZeroAmount();
    error SettlementFailed();

    event RwaPurchased(
        address indexed receiver,
        address indexed caller,
        bytes32 indexed ticker,
        uint256 amount
    );

    constructor() {
        // 1,000,000 mxUSD (6 decimals) - outlives any conceivable number of demo buys.
        settlementToken = new MockSettlementToken(address(this), 1_000_000_000_000);
    }

    /**
     * @notice Buy a mock RWA position and settle the x402 leg on-chain.
     * @param receiver Address credited with the mock holding.
     * @param ticker Asset ticker as bytes32 (e.g. bytes32("TSLA")).
     * @param amount Whole-token quantity (mock units).
     */
    function buy(address receiver, bytes32 ticker, uint256 amount) external {
        if (amount == 0) {
            revert ZeroAmount();
        }
        holdings[receiver][ticker] += amount;
        bool settled = settlementToken.transfer(X402_TREASURY, SETTLEMENT_AMOUNT);
        if (!settled) {
            revert SettlementFailed();
        }
        emit RwaPurchased(receiver, msg.sender, ticker, amount);
    }
}
