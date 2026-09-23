#!/bin/bash
# switch_to_personal_account.sh - Switch to personal GCP account and configure

set -e

echo "============================================================"
echo "🔀 Switching to Personal GCP Account"
echo "============================================================"
echo ""

# Prompt for personal project ID
if [ -z "$PERSONAL_PROJECT_ID" ]; then
    echo "📋 Please enter your personal GCP Project ID:"
    read -r PERSONAL_PROJECT_ID
fi

if [ -z "$PERSONAL_PROJECT_ID" ]; then
    echo "❌ Error: Project ID is required"
    exit 1
fi

echo ""
echo "🔑 Authenticating with personal account..."
echo "   You'll be prompted to log in with your personal Google account"
echo ""

# Authenticate with personal account
gcloud auth login

echo ""
echo "📝 Setting Application Default Credentials..."
gcloud auth application-default login

echo ""
echo "🔧 Setting project context..."
gcloud config set project "$PERSONAL_PROJECT_ID"

echo ""
echo "✅ Verifying authentication..."
CURRENT_ACCOUNT=$(gcloud config get-value account)
CURRENT_PROJECT=$(gcloud config get-value project)

echo "   Account: $CURRENT_ACCOUNT"
echo "   Project: $CURRENT_PROJECT"

if [ "$CURRENT_PROJECT" != "$PERSONAL_PROJECT_ID" ]; then
    echo "❌ Error: Project not set correctly"
    exit 1
fi

echo ""
echo "💾 Saving configuration..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

# Save current Udacity config for later restoration
if [ -f ".env.udacity" ]; then
    echo "⚠️  .env.udacity already exists, backing up..."
    mv .env.udacity .env.udacity.backup.$(date +%Y%m%d_%H%M%S)
fi

# Backup current .env as Udacity version
if [ -f ".env" ]; then
    cp .env .env.udacity
    echo "✅ Saved current .env as .env.udacity"
fi

echo ""
echo "============================================================"
echo "✅ Successfully switched to personal account!"
echo "============================================================"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./setup_personal_account.sh $PERSONAL_PROJECT_ID"
echo "2. This will:"
echo "   - Enable required APIs"
echo "   - Create GCS bucket and upload PDFs"
echo "   - Create Vertex AI Search datastore"
echo "   - Update .env with personal account details"
echo ""
echo "⚠️  Note: When done, run ./switch_back_to_udacity.sh to restore"
echo ""
