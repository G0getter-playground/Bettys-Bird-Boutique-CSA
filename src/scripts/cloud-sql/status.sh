#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

# status.sh - Check status of Betty's Bird Boutique project resources
# This script shows the current state of all GCP resources

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="a4617265-u4192188-1762158583"
SQL_INSTANCE="betty-bird-db"

echo -e "${BLUE}🐦 Betty's Bird Boutique - Resource Status${NC}\n"

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI not found.${NC}"
    exit 1
fi

# Check authentication
echo -e "${YELLOW}📋 Authentication:${NC}"
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)
if [ -n "$ACTIVE_ACCOUNT" ]; then
    echo -e "${GREEN}✓ Authenticated as: ${ACTIVE_ACCOUNT}${NC}"
else
    echo -e "${RED}❌ Not authenticated${NC}"
    exit 1
fi

# Check project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
echo -e "${YELLOW}📋 Project:${NC}"
if [ "$CURRENT_PROJECT" = "$PROJECT_ID" ]; then
    echo -e "${GREEN}✓ Current project: ${PROJECT_ID}${NC}"
else
    echo -e "${YELLOW}⚠ Current project: ${CURRENT_PROJECT}${NC}"
    echo -e "${YELLOW}   Expected: ${PROJECT_ID}${NC}"
fi

# Check Cloud SQL instance
echo -e "\n${YELLOW}💾 Cloud SQL Instance (${SQL_INSTANCE}):${NC}"
INSTANCE_STATUS=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$INSTANCE_STATUS" = "NOT_FOUND" ]; then
    echo -e "${RED}❌ Instance not found${NC}"
elif [ "$INSTANCE_STATUS" = "RUNNABLE" ]; then
    echo -e "${GREEN}✓ Status: RUNNING${NC}"
    INSTANCE_IP=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(ipAddresses[0].ipAddress)" 2>/dev/null || echo "")
    if [ -n "$INSTANCE_IP" ]; then
        echo -e "${GREEN}  IP Address: ${INSTANCE_IP}${NC}"
    fi
    echo -e "${RED}  ⚠️  WARNING: Instance is running and incurring costs!${NC}"
elif [ "$INSTANCE_STATUS" = "STOPPED" ] || [ "$INSTANCE_STATUS" = "SUSPENDED" ]; then
    echo -e "${YELLOW}✓ Status: STOPPED${NC}"
    echo -e "${GREEN}  💰 Not incurring compute costs${NC}"
else
    echo -e "${YELLOW}⚠ Status: ${INSTANCE_STATUS}${NC}"
fi

# Check MCP Toolbox
echo -e "\n${YELLOW}🔧 MCP Toolbox Server:${NC}"
TOOLBOX_PID=$(lsof -ti:5000 2>/dev/null || echo "")
if [ -n "$TOOLBOX_PID" ]; then
    echo -e "${GREEN}✓ Running on port 5000 (PID: ${TOOLBOX_PID})${NC}"
else
    echo -e "${YELLOW}⚠ Not running${NC}"
    echo -e "${YELLOW}  Start with: ./toolbox --tools-file \"tools.yaml\"${NC}"
fi

# Check .env file
echo -e "\n${YELLOW}📄 Configuration (.env file):${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Check if MySQL config is set
    if grep -q "^MYSQL_HOST=" .env && ! grep -q "^MYSQL_HOST=your-mysql-host-ip" .env; then
        MYSQL_HOST=$(grep "^MYSQL_HOST=" .env | cut -d'=' -f2)
        echo -e "${GREEN}  MySQL Host: ${MYSQL_HOST}${NC}"
    else
        echo -e "${YELLOW}  ⚠ MySQL Host not configured${NC}"
    fi
    
    # Check if Vertex AI Search is configured
    if grep -q "^DATASTORE_ENGINE_ID=" .env && ! grep -q "^DATASTORE_ENGINE_ID=your-engine-id-here" .env; then
        ENGINE_ID=$(grep "^DATASTORE_ENGINE_ID=" .env | cut -d'=' -f2)
        echo -e "${GREEN}  Vertex AI Search Engine ID: ${ENGINE_ID}${NC}"
    else
        echo -e "${YELLOW}  ⚠ Vertex AI Search not configured${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Quick Actions:${NC}"
echo -e "  ${GREEN}./start.sh${NC}  - Start all resources"
echo -e "  ${RED}./stop.sh${NC}   - Stop all resources"
echo -e "  ${YELLOW}./status.sh${NC} - Check status (this script)"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
