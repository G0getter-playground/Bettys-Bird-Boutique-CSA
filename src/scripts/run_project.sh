#!/bin/bash
# run_project.sh - Master script to run Betty's Bird Boutique project end-to-end
# This script orchestrates the complete workflow from setup to cleanup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"
PERSONAL_SCRIPTS="$SCRIPTS_DIR/personal-account"
CLOUD_SQL_SCRIPTS="$SCRIPTS_DIR/cloud-sql"
UTILS_SCRIPTS="$SCRIPTS_DIR/utils"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "============================================================"
echo "🐦 Betty's Bird Boutique - Complete Project Workflow"
echo "============================================================"
echo ""

# Step 1: Get personal project ID
if [ -z "$PERSONAL_PROJECT_ID" ]; then
    echo -e "${BLUE}Step 1: Personal GCP Project Configuration${NC}"
    echo ""
    echo "Enter your personal GCP Project ID:"
    read -r PERSONAL_PROJECT_ID
    echo ""
fi

if [ -z "$PERSONAL_PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: Project ID is required${NC}"
    exit 1
fi

# Step 2: Switch to personal account
echo -e "${BLUE}Step 2: Switching to Personal GCP Account${NC}"
echo ""
cd "$SCRIPT_DIR"
export PERSONAL_PROJECT_ID
bash "$PERSONAL_SCRIPTS/switch_to_personal_account.sh"
echo ""

# Step 3: Setup personal account (APIs, bucket, datastore)
echo -e "${BLUE}Step 3: Setting Up Personal Account Resources${NC}"
echo ""
bash "$PERSONAL_SCRIPTS/setup_personal_account.sh" "$PERSONAL_PROJECT_ID"
echo ""

# Step 4: Verify setup
echo -e "${BLUE}Step 4: Verifying Setup${NC}"
echo ""
cd "$SCRIPT_DIR"
if [ -f "$UTILS_SCRIPTS/preflight_check.py" ]; then
    python3 "$UTILS_SCRIPTS/preflight_check.py" || echo "⚠️  Preflight check had warnings, but continuing..."
fi
echo ""

# Step 5: Start Cloud SQL (if using Udacity database)
echo -e "${BLUE}Step 5: Starting Cloud SQL Database${NC}"
echo ""
bash "$CLOUD_SQL_SCRIPTS/start.sh"
echo ""

# Step 6: Wait for indexing
echo -e "${YELLOW}⏳ Waiting for Vertex AI Search indexing...${NC}"
echo ""
echo "This typically takes 5-10 minutes."
echo "You can check status at:"
echo "https://console.cloud.google.com/gen-app-builder/data-stores?project=${PERSONAL_PROJECT_ID}"
echo ""
read -p "Press Enter when indexing is complete (or wait 10 minutes)..."
echo ""

# Step 7: Test the agent
echo -e "${BLUE}Step 6: Testing the Agent${NC}"
echo ""
echo "⚠️  IMPORTANT: Make sure MCP Toolbox is running in another terminal:"
echo "   cd starter && ./toolbox --tools-file \"tools.yaml\""
echo ""
read -p "Press Enter when toolbox is running..."
echo ""

# Check if toolbox is running
if ! curl -s http://127.0.0.1:5000/health >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Toolbox doesn't seem to be running. Starting test anyway...${NC}"
    echo ""
fi

echo -e "${GREEN}Starting ADK web UI...${NC}"
echo "The agent will be available at: http://localhost:8000"
echo ""
echo "Test queries:"
echo "  1. Database: 'What's the price of a bird cage?'"
echo "  2. Datastore: 'What are your store hours?'"
echo "  3. Web Search: 'What kind of bird did Betty own?'"
echo "  4. Guardrail: 'Tell me about politics'"
echo ""
echo -e "${YELLOW}Press Ctrl+C when done testing...${NC}"
echo ""

cd "$SCRIPT_DIR"
adk web || {
    echo ""
    echo -e "${YELLOW}⚠️  ADK web failed. You can run manually: adk web${NC}"
    echo ""
}

# Step 8: Cleanup confirmation
echo ""
echo "============================================================"
echo -e "${BLUE}Step 7: Cleanup${NC}"
echo "============================================================"
echo ""
echo "Do you want to clean up all resources now? (yes/no)"
read -r CLEANUP

if [ "$CLEANUP" = "yes" ]; then
    echo ""
    echo -e "${YELLOW}Cleaning up resources...${NC}"
    echo ""
    
    # Stop Cloud SQL
    bash "$CLOUD_SQL_SCRIPTS/stop.sh"
    echo ""
    
    # Cleanup personal account
    bash "$PERSONAL_SCRIPTS/cleanup_personal_account.sh" "$PERSONAL_PROJECT_ID"
    echo ""
    
    # Switch back to Udacity
    bash "$PERSONAL_SCRIPTS/switch_back_to_udacity.sh"
    echo ""
    
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Skipping cleanup. Remember to run:${NC}"
    echo "   ./scripts/personal-account/cleanup_personal_account.sh $PERSONAL_PROJECT_ID"
    echo "   ./scripts/personal-account/switch_back_to_udacity.sh"
    echo ""
fi

echo ""
echo "============================================================"
echo -e "${GREEN}✅ Project workflow complete!${NC}"
echo "============================================================"
