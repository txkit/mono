// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { MockPendleRouter } from "../src/MockPendleRouter.sol";

/**
 * @notice Deploys MockPendleRouter to Arbitrum Sepolia (chainId 421614) for
 *         the Buildathon demo scenario A. The off-chain envelope builder
 *         hardcodes the router on Arbitrum Sepolia, so this is the only chain
 *         that needs the mock.
 *
 * Usage:
 *   forge script script/DeployMockPendleRouter.s.sol \
 *     --rpc-url arbitrum_sepolia \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $ARBISCAN_API_KEY
 *
 * Required environment:
 *   - DEPLOYER_PRIVATE_KEY  (deployer key)
 *   - ARB_SEPOLIA_RPC_URL   (RPC endpoint)
 *   - ARBISCAN_API_KEY      (only required for --verify)
 *
 * After deployment:
 *   1. Append the address to contracts/deployed.json under MockPendleRouter.
 *   2. Sync the address into examples/arbitrum-london/decoder-data/mock-pendle-router.json.
 *   3. Allow-list the router on the gate so executeEnvelope accepts it:
 *      cast send <gate> "setAllowedRecipient(address,bool)" <router> true \
 *        --rpc-url arbitrum_sepolia --private-key $DEPLOYER_PRIVATE_KEY
 */
contract DeployMockPendleRouter is Script {
    function run() external returns (MockPendleRouter router) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        router = new MockPendleRouter();
        vm.stopBroadcast();

        console2.log("MockPendleRouter deployed at:", address(router));
        console2.log("Chain:", block.chainid);
        console2.log("Remember: allow-list this address on AgentPolicyGate via setAllowedRecipient");
    }
}
