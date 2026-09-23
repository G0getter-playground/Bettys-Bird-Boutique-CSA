#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

# stop.sh - Stop Betty's Bird Boutique project resources
# This script stops all GCP resources to save costs
# Run this when you're done testing or taking a break

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="a4617265-u4192188-1762158583"
SQL_INSTANCE="betty-bird-db"

echo -e "${YELLOW}🐦 Stopping Betty's Bird Boutique Project Resources...${NC}\n"

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI not found. Please install Google Cloud SDK.${NC}"
    exit 1
fi

# Check if authenticated
echo -e "${YELLOW}📋 Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: Not authenticated with gcloud.${NC}"
    echo -e "${YELLOW}   Run: gcloud auth application-default login${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project "$PROJECT_ID" --quiet

# Stop Cloud SQL instance
echo -e "\n${YELLOW}💾 Stopping Cloud SQL MySQL instance...${NC}"
INSTANCE_STATUS=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$INSTANCE_STATUS" = "NOT_FOUND" ]; then
    echo -e "${YELLOW}⚠ Cloud SQL instance '${SQL_INSTANCE}' not found (may already be deleted).${NC}"
elif [ "$INSTANCE_STATUS" = "STOPPED" ] || [ "$INSTANCE_STATUS" = "SUSPENDED" ]; then
    echo -e "${GREEN}✓ Cloud SQL instance is already stopped${NC}"
elif [ "$INSTANCE_STATUS" = "RUNNABLE" ]; then
    echo -e "${YELLOW}   Stopping instance (this may take a few minutes)...${NC}"
    gcloud sql instances patch "$SQL_INSTANCE" --activation-policy=NEVER --quiet
    
    # Wait for instance to be STOPPED
    echo -e "${YELLOW}   Waiting for instance to stop...${NC}"
    MAX_WAIT=300  # 5 minutes
    ELAPSED=0
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        CURRENT_STATUS=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(state)" 2>/dev/null)
        if [ "$CURRENT_STATUS" = "STOPPED" ] || [ "$CURRENT_STATUS" = "SUSPENDED" ]; then
            echo -e "${GREEN}✓ Cloud SQL instance stopped successfully${NC}"
            break
        fi
        echo -e "${YELLOW}   Waiting... (${ELAPSED}s elapsed)${NC}"
        sleep 10
        ELAPSED=$((ELAPSED + 10))
    done
    
    if [ "$CURRENT_STATUS" != "STOPPED" ] && [ "$CURRENT_STATUS" != "SUSPENDED" ]; then
        echo -e "${RED}❌ Warning: Instance may still be stopping. Check status manually.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Instance status: ${INSTANCE_STATUS}${NC}"
    echo -e "${YELLOW}   Attempting to stop anyway...${NC}"
    gcloud sql instances patch "$SQL_INSTANCE" --activation-policy=NEVER --quiet
fi

# Check for MCP Toolbox process
echo -e "\n${YELLOW}🔍 Checking for running MCP Toolbox server...${NC}"
TOOLBOX_PID=$(lsof -ti:5000 2>/dev/null || echo "")
if [ -n "$TOOLBOX_PID" ]; then
    echo -e "${YELLOW}⚠ Found MCP Toolbox server running on port 5000 (PID: ${TOOLBOX_PID})${NC}"
    echo -e "${YELLOW}   To stop it, run: kill ${TOOLBOX_PID}${NC}"
    echo -e "${YELLOW}   Or find the terminal where it's running and press Ctrl+C${NC}"
else
    echo -e "${GREEN}✓ No MCP Toolbox server running${NC}"
fi

# Summary
echo -e "\n${GREEN}✅ Project resources stopped successfully!${NC}\n"
echo -e "${YELLOW}💰 Cost savings: Cloud SQL instance is stopped and no longer incurring compute costs.${NC}"
echo -e "${YELLOW}   Note: You may still incur storage costs for the stopped instance.${NC}\n"
echo -e "${YELLOW}📝 To start again, run: ./start.sh${NC}\n"

# Optional: Show cost reminder
echo -e "${YELLOW}💡 Budget Tip:${NC}"
echo -e "   - Stopped instances only incur storage costs (~$0.10-0.17/GB/month)"
echo -e "   - To completely eliminate costs, delete the instance (data will be lost)"
echo -e "   - Current budget: \$25 (Udacity Cloud Lab)\n"
