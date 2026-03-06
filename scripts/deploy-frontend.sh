#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TARGET_DIR=${TARGET_DIR:-/var/www/wbu-schedule-landing}

cd "$ROOT_DIR"
npm run build
mkdir -p "$TARGET_DIR"
rm -rf "$TARGET_DIR"/*
cp -a dist/. "$TARGET_DIR"/

echo "Deployed frontend to $TARGET_DIR"
find "$TARGET_DIR" -maxdepth 2 -type f | sort
