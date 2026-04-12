#!/usr/bin/env bash
set -euo pipefail

check_workspace() {
  local workspace="$1"
  if [ ! -f "$workspace/package.json" ]; then
    echo "❌ $workspace/package.json no existe"
    exit 1
  fi

  if [ ! -d "$workspace/node_modules" ]; then
    echo "⚠️  $workspace/node_modules no existe. Ejecuta: npm install --prefix $workspace"
  else
    echo "✅ $workspace/node_modules presente"
  fi
}

echo "Verificando workspaces..."
check_workspace backend
check_workspace frontend

echo "Preflight completado"
