// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";

/**
 * @notice Deploys AgentPolicyGate to Arbitrum Sepolia (chainId 421614).
 *
 * Usage:
 *   forge script script/DeployArbSepolia.s.sol \
 *     --rpc-url arbitrum_sepolia \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $ARBISCAN_API_KEY
 *
 * Required environment:
 *   - DEPLOYER_PRIVATE_KEY  (must be the owner private key)
 *   - AGENT_SIGNER_ADDRESS  (signer for envelopes)
 *   - ARB_SEPOLIA_RPC_URL   (RPC endpoint)
 *   - ARBISCAN_API_KEY      (only required for --verify)
 *
 * After deployment, append the address to `contracts/deployed.json` and
 * sync the registry entry in `examples/arbitrum-london/decoder-data/agent-policy-gate.json`
 * (NOT the public packages/tx-decoder/src/registry/data/ - that path no
 * longer carries AgentPolicyGate after the alpha.4 cleanup).
 */
contract DeployArbSepolia is Script {
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
