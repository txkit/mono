// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { MockRwaRouter } from "../src/MockRwaRouter.sol";

/**
 * @notice Deploys MockRwaRouter to Arbitrum Sepolia (chainId 421614) for the
 *         Buildathon demo scenario C (RWA buy). The gate already exists on
 *         Arbitrum Sepolia, so this deploys only the router; allow-list it on
 *         the gate afterwards. The same script works on any chain (e.g. run it
 *         against robinhood_testnet to add the RWA router there too), since the
 *         router takes no constructor arguments.
 *
 * Usage:
 *   forge script script/DeployMockRwaRouter.s.sol \
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
 *   1. Append the address to contracts/deployed.json under MockRwaRouter (421614).
 *   2. Sync the address into examples/arbitrum-london/decoder-data/mock-rwa-router.json.
 *   3. Allow-list the router on the gate so executeEnvelope accepts it:
 *      cast send <gate> "setAllowedRecipient(address,bool)" <router> true \
 *        --rpc-url arbitrum_sepolia --private-key $DEPLOYER_PRIVATE_KEY
 */
contract DeployMockRwaRouter is Script {
    function run() external returns (MockRwaRouter router) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        router = new MockRwaRouter();
        vm.stopBroadcast();

        console2.log("MockRwaRouter deployed at:", address(router));
        console2.log("Chain:", block.chainid);
        console2.log("Remember: allow-list this address on AgentPolicyGate via setAllowedRecipient");
    }
}
