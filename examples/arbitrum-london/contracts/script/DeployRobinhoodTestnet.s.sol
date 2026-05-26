// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";

/**
 * @notice Deploys AgentPolicyGate to Robinhood Chain testnet (chainId 46630).
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
 * Note: Robinhood Chain testnet explorer does not publish a verifier API
 * as of 2026-05-26 - source verification is manual or skipped.
 */
contract DeployRobinhoodTestnet is Script {
    function run() external returns (AgentPolicyGate gate) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agentSigner = vm.envAddress("AGENT_SIGNER_ADDRESS");
        address owner = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        gate = new AgentPolicyGate(owner, agentSigner);
        vm.stopBroadcast();

        console2.log("AgentPolicyGate deployed at:", address(gate));
        console2.log("Owner:", owner);
        console2.log("Agent signer:", agentSigner);
        console2.log("Chain:", block.chainid);
    }
}
