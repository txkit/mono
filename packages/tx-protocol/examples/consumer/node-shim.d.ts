/**
 * Minimal ambient declarations for the Node globals this demo uses.
 *
 * The consumer example is run with `tsx`, which supplies the real Node
 * runtime; this shim exists only so `tsc --noEmit` can type-check the demo
 * without pulling in the full `@types/node` package (which is not a
 * dependency of @txkit/tx-protocol). It declares exactly the surface used:
 * `process.exit`.
 */

declare const process: {
  exit(code?: number): never
}
