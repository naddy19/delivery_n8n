#!/bin/sh
set -e

echo "Importing/Updating workflows from /workflows..."

for workflow_file in /workflows/*.json; do
  if [ -f "$workflow_file" ]; then
    workflow_name=$(basename "$workflow_file")
    echo "Importing $workflow_name..."
    n8n import:workflow --input="$workflow_file" 2>&1 | head -3 || true
  fi
done

echo "✓ Workflow sync complete!"
echo "Starting n8n..."

exec n8n start
