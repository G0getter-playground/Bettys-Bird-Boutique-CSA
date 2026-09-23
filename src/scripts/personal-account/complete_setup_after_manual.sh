#!/bin/bash
# complete_setup_after_manual_creation.sh - Complete setup after manually creating datastore

set -e

PROJECT_ID="${1:-second-brain-463904}"
DATA_STORE_ID="${2:-betty-bird-boutique-datastore}"
LOCATION="global"
BUCKET="gs://betty-bird-boutique-docs-second-brain-463904"

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 [PROJECT_ID] [DATA_STORE_ID]"
    exit 1
fi

echo "============================================================"
echo "📝 Completing Setup After Manual Datastore Creation"
echo "============================================================"
echo ""

# Update .env file
echo "📝 Updating .env file..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

cat > .env <<EOF
# Environment Variables for Betty's Bird Boutique Agent
# Personal GCP Account Configuration

# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT=${PROJECT_ID}
GOOGLE_CLOUD_LOCATION=${LOCATION}

# Vertex AI Search Configuration
DATASTORE_PROJECT_ID=${PROJECT_ID}
DATASTORE_LOCATION=${LOCATION}
DATASTORE_ENGINE_ID=${DATA_STORE_ID}

# MySQL Database Configuration
# Note: Using Udacity Cloud SQL instance (shared for testing)
MYSQL_HOST=35.226.62.44
MYSQL_PORT=3306
MYSQL_USER=betty_user
MYSQL_PASSWORD=Cc6hD88gWlK9oBwm

# MCP Toolbox Configuration
TOOLBOX_URL=http://127.0.0.1:5000

# Note: Using Application Default Credentials (ADC)
# Run: gcloud auth application-default login
EOF

echo "✅ .env file updated!"
echo ""

# Import documents
echo "📥 Importing documents from GCS..."
echo ""

ACCESS_TOKEN=$(gcloud auth print-access-token)
IMPORT_API_URL="https://discoveryengine.googleapis.com/v1alpha/projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATA_STORE_ID}/branches/0/documents:import"

IMPORT_BODY=$(cat <<EOF
{
  "gcsSource": {
    "inputUris": [
      "${BUCKET}/bettys-history.pdf",
      "${BUCKET}/bettys-hours.pdf",
      "${BUCKET}/bettys-staff.pdf"
    ],
    "dataSchema": "document"
  }
}
EOF
)

IMPORT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Goog-User-Project: ${PROJECT_ID}" \
  -d "${IMPORT_BODY}" \
  "${IMPORT_API_URL}")

IMPORT_HTTP_CODE=$(echo "$IMPORT_RESPONSE" | tail -n1)
IMPORT_BODY_RESPONSE=$(echo "$IMPORT_RESPONSE" | sed '$d')

if [ "$IMPORT_HTTP_CODE" = "200" ] || [ "$IMPORT_HTTP_CODE" = "202" ]; then
    echo "✅ Document import initiated!"
    echo ""
    echo "⏳ Indexing will take 5-10 minutes..."
    echo "   Check status: https://console.cloud.google.com/gen-app-builder/data-stores?project=${PROJECT_ID}"
else
    echo "⚠️  Warning: Document import may have failed (HTTP $IMPORT_HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$IMPORT_BODY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$IMPORT_BODY_RESPONSE"
    echo ""
    echo "💡 You can manually import documents via the console"
fi

echo ""
echo "============================================================"
echo "✅ Setup Complete!"
echo "============================================================"
echo ""
echo "📋 Summary:"
echo "   Project ID: $PROJECT_ID"
echo "   Bucket: $BUCKET"
echo "   Datastore ENGINE_ID: $DATA_STORE_ID"
echo ""
echo "⏳ Next: Wait 5-10 minutes for indexing, then proceed to Step 2"
echo ""
