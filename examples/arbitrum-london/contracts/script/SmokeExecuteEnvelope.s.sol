// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";

/**
 * @notice Submits one real AgentPolicyGate.executeEnvelope transaction so the
 *         demo has a verifiable on-chain tx hash. The Buildathon AI Agentic
 *         category requires real transactions, not preview-only flows.
 *
 *         It reproduces exactly what the dApp does end to end: build the inner
 *         MockPendleRouter swap calldata, sign the EIP-712 envelope with the
 *         agent signer key, then execute it through the gate. The difference is
 *         only the submission surface - here a forge broadcast instead of a
 *         browser wallet - so the resulting tx hash is the same shape a judge
 *         sees from the UI, and it is reproducible from the command line.
 *
 *         Chain-agnostic: point --rpc-url at either chain wired in foundry.toml
 *         (arbitrum_sepolia or robinhood_testnet). This is the only way to land
 *         a real tx on Robinhood Chain testnet, where scenario C has no UI flow
 *         yet - run it there for the sponsor bonus "real tx on both chains".
 *
 * @dev Prerequisites (see DEPLOY.md): the gate and router are deployed on the
 *      target chain, the router is allow-listed on the gate, and
 *      AGENT_SIGNER_PRIVATE_KEY matches the gate's agentSigner. The agent
 *      signature is recovered on-chain, so a signer mismatch reverts
 *      InvalidSignature and a missing allow-list reverts RecipientNotAllowed.
 *
 * Usage:
 *   GATE_ADDRESS=0x... ROUTER_ADDRESS=0x... \
 *   forge script script/SmokeExecuteEnvelope.s.sol \
 *     --rpc-url arbitrum_sepolia \
 *     --broadcast
 *
 * Required environment:
 *   - DEPLOYER_PRIVATE_KEY      (submits the tx, pays gas)
 *   - AGENT_SIGNER_PRIVATE_KEY  (signs the envelope; must equal the gate agentSigner)
 *   - GATE_ADDRESS              (deployed AgentPolicyGate)
 *   - ROUTER_ADDRESS           (deployed MockPendleRouter, allow-listed on the gate)
 */
contract SmokeExecuteEnvelope is Script {
    // Illustrative PT placeholder - the mock router is token-agnostic, so the
    // exact PT address does not matter for the deterministic 1:0.995 rate.
    address private constant PT_PLACEHOLDER = 0x000000000000000000000000000000000000De01;
    // 1 unit at 6 decimals, matching the demo's "1 USDC" framing.
    uint256 private constant AMOUNT_IN = 1_000_000;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 agentKey = vm.envUint("AGENT_SIGNER_PRIVATE_KEY");
        address gateAddress = vm.envAddress("GATE_ADDRESS");
        address routerAddress = vm.envAddress("ROUTER_ADDRESS");

        AgentPolicyGate gate = AgentPolicyGate(gateAddress);
        address receiver = vm.addr(deployerKey);

        // Inner action: the same MockPendleRouter swap the dApp encodes. minPtOut
        // is 0 so the deterministic mock rate always clears the slippage check.
        bytes memory innerData = abi.encodeWithSignature(
            "swapExactTokenForPt(address,address,uint256,uint256)",
            receiver,
            PT_PLACEHOLDER,
            AMOUNT_IN,
            uint256(0)
        );
        uint256 value = 0;

        // Unique per run so the gate replay guard (usedEnvelopes) never trips on
        // repeated demo recordings.
        bytes32 envelopeHash = keccak256(
            abi.encode(block.chainid, block.timestamp, receiver, vm.getNonce(receiver))
        );

        // Use the gate's own EIP-712 digest so the script never re-implements the hash.
        bytes32 digest = gate.hashExecuteEnvelope(envelopeHash, routerAddress, innerData, value);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.startBroadcast(deployerKey);
        gate.executeEnvelope{ value: value }(envelopeHash, signature, routerAddress, innerData, value);
        vm.stopBroadcast();

        console2.log("executeEnvelope broadcast on chain:", block.chainid);
        console2.log("gate:", gateAddress);
        console2.log("router:", routerAddress);
        console2.log("receiver:", receiver);
        console2.log("envelopeHash:");
        console2.logBytes32(envelopeHash);
        console2.log("Record the tx hash from the broadcast output (or broadcast/ json) in README.md.");
    }
}
