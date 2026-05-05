#!/bin/sh
# Local dev: Foundry Docker image. Slower startup (~3s) than native, but
# zero-install. Use ./anvil-ci.sh on CI runners that have Foundry preinstalled.
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

docker run --rm -d --name txkit-anvil \
  -p 8545:8545 \
  ghcr.io/foundry-rs/foundry:latest \
  "anvil --fork-url=$SEPOLIA_RPC_URL --chain-id=11155111 --block-time=2 --port=8545 --host=0.0.0.0"

cleanup() { docker stop txkit-anvil 2>/dev/null || true; }
trap cleanup INT TERM EXIT

docker logs -f txkit-anvil
