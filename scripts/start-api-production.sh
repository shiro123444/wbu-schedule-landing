#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ENV_FILE=${ENV_FILE:-/etc/wbu-schedule-api.env}
NODE_BIN=${NODE_BIN:-/root/.local/share/fnm/node-versions/v20.19.6/installation/bin/node}

if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN=$(command -v node)
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

cd "$ROOT_DIR"
exec "$NODE_BIN" "$ROOT_DIR/server/index.mjs"
