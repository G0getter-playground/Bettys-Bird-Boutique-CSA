#!/bin/bash
# test_agent.sh - Quick test script for the agent

set -e

echo "============================================================"
echo "🧪 Testing Betty's Bird Boutique Agent"
echo "============================================================"
echo ""

# Check if toolbox is running
if ! curl -s http://127.0.0.1:5000/health >/dev/null 2>&1; then
    echo "⚠️  MCP Toolbox server is not running!"
    echo ""
    echo "Please start it in a separate terminal:"
    echo "  cd starter"
    echo "  ./toolbox --tools-file \"tools.yaml\""
    echo ""
    read -p "Press Enter when toolbox is running, or Ctrl+C to cancel..."
fi

echo "✅ Toolbox server is running"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

# Check .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

echo "📋 Environment Configuration:"
echo ""
grep -E "^DATASTORE_|^MYSQL_|^GOOGLE_CLOUD_PROJECT" .env | sed 's/^/   /'
echo ""

# Start ADK web UI
echo "🚀 Starting ADK web UI..."
echo ""
echo "   The agent will be available at: http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""
echo "============================================================"
echo ""

adk web
