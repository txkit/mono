#!/bin/sh
# Native Foundry binary. Use on CI runners with foundry-rs/foundry-toolchain
# action installed, or locally if you have anvil on PATH.
set -e

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if [ -z "$SEPOLIA_RPC_URL" ]; then
  echo "Error: SEPOLIA_RPC_URL not set. Copy .env.example to .env and add your key." >&2
  exit 1
fi

anvil \
  --fork-url="$SEPOLIA_RPC_URL" \
  --chain-id=11155111 \
  --block-time=2 \
  --port=8545 \
  --host=0.0.0.0 &

anvil_pid=$!

cleanup() {
  if [ -n "$anvil_pid" ]; then kill "$anvil_pid" 2>/dev/null || true; fi
}
trap cleanup INT TERM EXIT

wait
