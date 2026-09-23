#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

# start.sh - Start Betty's Bird Boutique project resources
# This script starts all GCP resources needed for the project
# Run this before testing or using the agent

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="a4617265-u4192188-1762158583"
SQL_INSTANCE="betty-bird-db"

echo -e "${GREEN}🐦 Starting Betty's Bird Boutique Project Resources...${NC}\n"

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

# Start Cloud SQL instance
echo -e "\n${YELLOW}💾 Starting Cloud SQL MySQL instance...${NC}"
INSTANCE_STATUS=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$INSTANCE_STATUS" = "NOT_FOUND" ]; then
    echo -e "${RED}❌ Error: Cloud SQL instance '${SQL_INSTANCE}' not found.${NC}"
    echo -e "${YELLOW}   Please create it first or check the instance name.${NC}"
    exit 1
elif [ "$INSTANCE_STATUS" = "RUNNABLE" ]; then
    echo -e "${GREEN}✓ Cloud SQL instance is already running${NC}"
elif [ "$INSTANCE_STATUS" = "STOPPED" ] || [ "$INSTANCE_STATUS" = "SUSPENDED" ]; then
    echo -e "${YELLOW}   Starting instance (this may take a few minutes)...${NC}"
    gcloud sql instances patch "$SQL_INSTANCE" --activation-policy=ALWAYS --quiet
    echo -e "${YELLOW}   Waiting for instance to be ready...${NC}"
    
    # Wait for instance to be RUNNABLE
    MAX_WAIT=300  # 5 minutes
    ELAPSED=0
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        CURRENT_STATUS=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(state)" 2>/dev/null)
        if [ "$CURRENT_STATUS" = "RUNNABLE" ]; then
            echo -e "${GREEN}✓ Cloud SQL instance is now running${NC}"
            break
        fi
        echo -e "${YELLOW}   Waiting... (${ELAPSED}s elapsed)${NC}"
        sleep 10
        ELAPSED=$((ELAPSED + 10))
    done
    
    if [ "$CURRENT_STATUS" != "RUNNABLE" ]; then
        echo -e "${RED}❌ Warning: Instance may still be starting. Check status manually.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Instance status: ${INSTANCE_STATUS}${NC}"
fi

# Get instance IP address
echo -e "\n${YELLOW}📋 Getting instance details...${NC}"
INSTANCE_IP=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(ipAddresses[0].ipAddress)" 2>/dev/null || echo "")
if [ -n "$INSTANCE_IP" ]; then
    echo -e "${GREEN}✓ Instance IP: ${INSTANCE_IP}${NC}"
    
    # Update .env file with IP if it's different
    if [ -f ".env" ]; then
        CURRENT_IP=$(grep "^MYSQL_HOST=" .env | cut -d'=' -f2)
        if [ "$CURRENT_IP" != "$INSTANCE_IP" ]; then
            echo -e "${YELLOW}⚠ Updating .env file with new IP address...${NC}"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|^MYSQL_HOST=.*|MYSQL_HOST=${INSTANCE_IP}|" .env
            else
                # Linux
                sed -i "s|^MYSQL_HOST=.*|MYSQL_HOST=${INSTANCE_IP}|" .env
            fi
            echo -e "${GREEN}✓ Updated MYSQL_HOST in .env file${NC}"
        fi
    fi
fi

# Summary
echo -e "\n${GREEN}✅ Project resources started successfully!${NC}\n"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Start MCP Toolbox server: ./toolbox --tools-file \"tools.yaml\""
echo -e "   2. In another terminal, run: adk web"
echo -e "   3. When done, run: ./stop.sh to stop resources\n"
echo -e "${YELLOW}⚠️  Remember: Cloud SQL instance is running and incurring costs!${NC}"
echo -e "${YELLOW}   Run ./stop.sh when finished to save budget.${NC}\n"
