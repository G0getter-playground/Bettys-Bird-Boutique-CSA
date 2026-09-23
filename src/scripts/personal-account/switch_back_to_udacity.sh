#!/bin/bash
# switch_back_to_udacity.sh - Switch back to Udacity account

set -e

echo "============================================================"
echo "🔀 Switching Back to Udacity GCP Account"
echo "============================================================"
echo ""

UDACITY_ACCOUNT="user16609364987875b5@vocareumlabs.com"
UDACITY_PROJECT="a4617265-u4192188-1762158583"

echo "🔑 Authenticating with Udacity account..."
echo "   Account: $UDACITY_ACCOUNT"
echo ""

# Authenticate with Udacity account
gcloud auth login "$UDACITY_ACCOUNT" --no-launch-browser || gcloud auth login

echo ""
echo "📝 Setting Application Default Credentials..."
gcloud auth application-default login

echo ""
echo "🔧 Setting project context..."
gcloud config set project "$UDACITY_PROJECT"

echo ""
echo "✅ Verifying authentication..."
CURRENT_ACCOUNT=$(gcloud config get-value account)
CURRENT_PROJECT=$(gcloud config get-value project)

echo "   Account: $CURRENT_ACCOUNT"
echo "   Project: $CURRENT_PROJECT"

if [ "$CURRENT_PROJECT" != "$UDACITY_PROJECT" ]; then
    echo "❌ Error: Project not set correctly"
    exit 1
fi

echo ""
echo "💾 Restoring .env file..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

if [ -f ".env.udacity" ]; then
    cp .env.udacity .env
    echo "✅ Restored .env from .env.udacity"
else
    echo "⚠️  Warning: .env.udacity not found"
    echo "   You may need to manually update .env with Udacity project details"
fi

echo ""
echo "============================================================"
echo "✅ Successfully switched back to Udacity account!"
echo "============================================================"
echo ""
