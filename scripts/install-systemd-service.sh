#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SERVICE_NAME=wbu-schedule-api.service
SERVICE_FILE=/etc/systemd/system/${SERVICE_NAME}
ENV_FILE=/etc/wbu-schedule-api.env
START_SCRIPT=${ROOT_DIR}/scripts/start-api-production.sh

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root." >&2
  exit 1
fi

if [[ ! -x "$START_SCRIPT" ]]; then
  chmod +x "$START_SCRIPT"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  GENERATED_PASSWORD=$(head -c 24 /dev/urandom | base64 | tr -d '\n' | tr '/+' '_-' | cut -c1-32)
  cat > "$ENV_FILE" <<EOF
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${GENERATED_PASSWORD}
PORT=8787
EOF
  chmod 600 "$ENV_FILE"
  echo "Generated admin password: ${GENERATED_PASSWORD}"
else
  chmod 600 "$ENV_FILE"
fi

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=WBU Schedule Landing API Service
After=network.target

[Service]
Type=simple
WorkingDirectory=${ROOT_DIR}
Environment=NODE_ENV=production
EnvironmentFile=-${ENV_FILE}
ExecStart=${START_SCRIPT}
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl --no-pager --full status "$SERVICE_NAME" | sed -n '1,20p'
