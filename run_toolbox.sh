#!/bin/bash
# Convenience script to run the MCP Toolbox server
# Using port 5001 to avoid conflicts with AirPlay (port 5000)

# Ensure we are in the project root
cd "$(dirname "$0")"

# Activate virtual environment if not already activated
if [ -z "$VIRTUAL_ENV" ]; then
    source venv/bin/activate
fi

echo "Starting MCP Toolbox Server on port 5001..."
echo "Tools file: src/tools.yaml"

# Load environment variables
set -a
source src/.env
set +a

# Run using the python module directly to ensure correct environment
echo "MYSQL_PASSWORD length: ${#MYSQL_PASSWORD}"
./toolbox --log-level DEBUG --tools-file src/tools.yaml --port 5001
