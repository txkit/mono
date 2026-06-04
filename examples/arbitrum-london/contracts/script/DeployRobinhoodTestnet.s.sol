// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";
import { MockRwaRouter } from "../src/MockRwaRouter.sol";

/**
 * @notice Deploys AgentPolicyGate + MockRwaRouter to Robinhood Chain testnet
 *         (chainId 46630) and allow-lists the router on the gate, so the
 *         scenario C envelope path (executeEnvelope -> MockRwaRouter.buy) works
 *         in one broadcast. The deployer is the gate owner, so setAllowedRecipient
 *         can be called in the same transaction batch.
 *
 * Usage:
 *   forge script script/DeployRobinhoodTestnet.s.sol \
 *     --rpc-url robinhood_testnet \
 *     --broadcast
 *
 * Required environment:
 *   - DEPLOYER_PRIVATE_KEY
 *   - AGENT_SIGNER_ADDRESS
 *   - ROBINHOOD_TESTNET_RPC_URL
 *
 * After deployment:
 *   1. Append both addresses to contracts/deployed.json (AgentPolicyGate +
 *      MockRwaRouter, chainId 46630).
 *   2. Sync the router address into decoder-data/mock-rwa-router.json.
 *
 * Note: Robinhood Chain testnet explorer does not publish a verifier API
 * as of 2026-05-26 - source verification is manual or skipped.
 */
contract DeployRobinhoodTestnet is Script {
    function run() external returns (AgentPolicyGate gate, MockRwaRouter router) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agentSigner = vm.envAddress("AGENT_SIGNER_ADDRESS");
        address owner = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        gate = new AgentPolicyGate(owner, agentSigner);
        router = new MockRwaRouter();
        gate.setAllowedRecipient(address(router), true);
        vm.stopBroadcast();

        console2.log("AgentPolicyGate deployed at:", address(gate));
        console2.log("MockRwaRouter deployed at:", address(router));
        console2.log("Router allow-listed on gate. Owner:", owner);
        console2.log("Agent signer:", agentSigner);
        console2.log("Chain:", block.chainid);
        console2.log("Note: spendLimit is 0 (ETH value forwarding disabled). The mock RWA buy uses value=0; call setSpendLimit only if a value-bearing scenario is added.");
    }
}
