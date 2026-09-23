#!/bin/bash
# update_env.sh - Helper script to update ENGINE_ID in .env file
# Usage: ./update_env.sh <engine-id>

if [ -z "$1" ]; then
    echo "Usage: ./update_env.sh <ENGINE_ID>"
    echo "Example: ./update_env.sh betty-bird-boutique-datastore_1234567890"
    exit 1
fi

ENGINE_ID="$1"
ENV_FILE="starter/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found"
    exit 1
fi

# Update ENGINE_ID in .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^DATASTORE_ENGINE_ID=.*|DATASTORE_ENGINE_ID=${ENGINE_ID}|" "$ENV_FILE"
else
    # Linux
    sed -i "s|^DATASTORE_ENGINE_ID=.*|DATASTORE_ENGINE_ID=${ENGINE_ID}|" "$ENV_FILE"
fi

echo "✅ Updated DATASTORE_ENGINE_ID in $ENV_FILE"
echo "   New value: $ENGINE_ID"
echo ""
echo "📝 Next steps:"
echo "   1. Install dependencies: uv pip install -r requirements.txt"
echo "   2. Install MCP Toolbox (see COMPLETE_SETUP.md)"
echo "   3. Run pre-flight check: python3 preflight_check.py"
echo "   4. Start testing: ./start.sh"
