#!/bin/sh
# Native Foundry binary. Use on CI runners with foundry-rs/foundry-toolchain
# action installed, or locally if you have anvil on PATH.
#
# Wraps `anvil` in a retry loop because some networks (iCloud Private Relay,
# corporate proxies) drop the first TLS handshake to Alchemy / Infura. Three
# attempts with a 2s warm-up curl in between.

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

# Warm up TLS / DNS to the upstream RPC — first connection often drops on
# Apple's iCloud Private Relay; subsequent ones succeed.
curl -sf -o /dev/null --max-time 5 "$SEPOLIA_RPC_URL" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  || echo "[anvil-ci.sh] warm-up curl failed, anvil may need retries"

attempt=1
max_attempts=3

cleanup() {
  if [ -n "$anvil_pid" ]; then kill "$anvil_pid" 2>/dev/null || true; fi
}

trap cleanup INT TERM EXIT

while [ "$attempt" -le "$max_attempts" ]; do
  anvil \
    --fork-url="$SEPOLIA_RPC_URL" \
    --chain-id=11155111 \
    --block-time=2 \
    --port=8545 \
    --host=0.0.0.0 &

  anvil_pid=$!

  # Wait up to 15s for anvil to start listening
  ready=""
  for _ in $(seq 1 30); do
    if curl -sf -o /dev/null --max-time 1 http://localhost:8545 \
      -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'; then
      ready=1
      break
    fi
    sleep 0.5
  done

  if [ -n "$ready" ]; then
    echo "[anvil-ci.sh] anvil ready on attempt $attempt"
    wait "$anvil_pid"
    exit 0
  fi

  echo "[anvil-ci.sh] attempt $attempt failed, retrying..."
  kill "$anvil_pid" 2>/dev/null || true
  wait "$anvil_pid" 2>/dev/null || true
  anvil_pid=""
  attempt=$((attempt + 1))
  sleep 2
done

echo "[anvil-ci.sh] anvil failed to start after $max_attempts attempts" >&2
exit 1
