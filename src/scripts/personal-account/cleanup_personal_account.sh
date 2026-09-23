#!/bin/bash
# cleanup_personal_account.sh - Clean up all resources in personal account

set -e

PROJECT_ID="${1:-}"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Project ID required"
    echo "Usage: $0 <PROJECT_ID>"
    exit 1
fi

echo "============================================================"
echo "🧹 Cleaning Up Personal GCP Account Resources"
echo "============================================================"
echo ""
echo "⚠️  WARNING: This will delete the following resources:"
echo "   - Vertex AI Search datastore"
echo "   - GCS bucket and all files"
echo ""
echo "Project ID: $PROJECT_ID"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

# Verify we're on the right project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "⚠️  Setting project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID"
fi

# Step 1: Delete Vertex AI Search datastore
echo ""
echo "🔍 Step 1: Deleting Vertex AI Search datastore..."
echo ""
DATA_STORE_ID="betty-bird-boutique-datastore"
LOCATION="global"
COLLECTION_ID="default_collection"

ACCESS_TOKEN=$(gcloud auth print-access-token)
DELETE_URL="https://discoveryengine.googleapis.com/v1alpha/projects/${PROJECT_ID}/locations/${LOCATION}/collections/${COLLECTION_ID}/dataStores/${DATA_STORE_ID}"

DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-Goog-User-Project: ${PROJECT_ID}" \
  "${DELETE_URL}")

HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo "✅ Datastore deleted successfully"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "ℹ️  Datastore not found (may already be deleted)"
else
    echo "⚠️  Warning: Unexpected response (HTTP $HTTP_CODE)"
    echo "   You may need to delete manually via console:"
    echo "   https://console.cloud.google.com/gen-app-builder/data-stores?project=${PROJECT_ID}"
fi

# Step 2: Delete GCS bucket
echo ""
echo "🪣 Step 2: Deleting GCS bucket..."
echo ""
BUCKET="gs://betty-bird-boutique-docs"

if gsutil ls -b "$BUCKET" >/dev/null 2>&1; then
    echo "   Deleting bucket: $BUCKET"
    gsutil -m rm -r "$BUCKET"
    echo "✅ Bucket deleted successfully"
else
    echo "ℹ️  Bucket not found (may already be deleted)"
fi

echo ""
echo "============================================================"
echo "✅ Cleanup Complete!"
echo "============================================================"
echo ""
echo "📋 Summary:"
echo "   ✅ Vertex AI Search datastore deleted"
echo "   ✅ GCS bucket deleted"
echo ""
echo "💡 Note: You can now run ./switch_back_to_udacity.sh if needed"
echo ""
