import { prepareEvmTxTool } from './prepare-evm-tx'
import type { ToolDefinition } from '../types'


/**
 * The default tool surface. v0.1 ships a single prepare tool as the
 * scaffolding contract. Subsequent versions add:
 *   - prepare_evm_batch  (EIP-5792 batches)
 *   - prepare_signature  (EIP-712 / SIWE / personal-sign)
 *   - decode_tx          (calls @txkit/tx-decoder)
 *   - simulate_tx        (eth_call simulation, opt-in via injected RPC)
 *   - get_position       (read-layer for protocol adapters)
 *
 * Tools are intent-based and narrow. There is no generic eval, exec, or
 * shell tool, and there will not be one.
 */
export const DEFAULT_TOOLS: ReadonlyArray<ToolDefinition<unknown>> = [
  // The handler's `input` parameter is contravariant: a tool with a narrow
  // input type cannot satisfy `ToolDefinition<unknown>` even though the
  // schema validates at runtime. The cast is the only way to express
  // "TS doesn't see it, but the schema enforces this" without losing the
  // per-tool TInput typing inside the tool module itself.
  prepareEvmTxTool as ToolDefinition<unknown>,
]

export { prepareEvmTxTool }
