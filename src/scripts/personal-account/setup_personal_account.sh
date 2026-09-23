#!/bin/bash
# setup_personal_account.sh - Complete setup for personal GCP account

set -e

PROJECT_ID="${1:-}"
LOCATION="global"  # Personal accounts can use global
COLLECTION_ID="default_collection"
DATA_STORE_ID="betty-bird-boutique-datastore"
DATA_STORE_DISPLAY_NAME="Betty's Bird Boutique Documents"
BUCKET_LOCATION="us-central1"  # Bucket location (can be regional)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Project ID required"
    echo "Usage: $0 <PROJECT_ID>"
    exit 1
fi

# Use project-specific bucket name to avoid conflicts
BUCKET_NAME="betty-bird-boutique-docs-$(echo ${PROJECT_ID} | tr ':' '-' | tr '.' '-')"

echo "============================================================"
echo "🚀 Setting Up Personal GCP Account for Betty's Bird Boutique"
echo "============================================================"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Location: $LOCATION"
echo ""

# Verify we're on the right project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "⚠️  Setting project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID"
fi

# Step 1: Enable APIs
echo "📚 Step 1: Enabling required APIs..."
echo ""
gcloud services enable discoveryengine.googleapis.com --project="$PROJECT_ID"
gcloud services enable storage.googleapis.com --project="$PROJECT_ID"
gcloud services enable sqladmin.googleapis.com --project="$PROJECT_ID"
echo "✅ APIs enabled"
echo ""

# Step 2: Create GCS bucket
echo "🪣 Step 2: Creating GCS bucket..."
echo ""
BUCKET="gs://${BUCKET_NAME}"
if gsutil ls -b "$BUCKET" >/dev/null 2>&1; then
    echo "✅ Bucket already exists: $BUCKET"
else
    gsutil mb -l "$BUCKET_LOCATION" "$BUCKET"
    echo "✅ Bucket created: $BUCKET"
fi
echo ""

# Step 3: Upload PDFs
echo "📄 Step 3: Uploading PDF documents..."
echo ""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PDF_DIR="$SCRIPT_DIR/docs"
PDFS=("bettys-history.pdf" "bettys-hours.pdf" "bettys-staff.pdf")

for pdf in "${PDFS[@]}"; do
    PDF_PATH="$PDF_DIR/$pdf"
    if [ -f "$PDF_PATH" ]; then
        echo "   Uploading $pdf..."
        gsutil cp "$PDF_PATH" "$BUCKET/"
        echo "   ✅ $pdf uploaded"
    else
        echo "   ⚠️  Warning: $PDF_PATH not found, skipping..."
    fi
done
echo ""

# Step 4: Create Vertex AI Search datastore
echo "🔍 Step 4: Creating Vertex AI Search datastore..."
echo ""
echo "   This may take a few minutes..."
echo ""

ACCESS_TOKEN=$(gcloud auth print-access-token)
API_URL="https://discoveryengine.googleapis.com/v1alpha/projects/${PROJECT_ID}/locations/${LOCATION}/collections/${COLLECTION_ID}/dataStores?dataStoreId=${DATA_STORE_ID}"

REQUEST_BODY=$(cat <<EOF
{
  "displayName": "${DATA_STORE_DISPLAY_NAME}",
  "industryVertical": "GENERIC",
  "contentConfig": "CONTENT_REQUIRED",
  "solutionTypes": ["SOLUTION_TYPE_SEARCH"]
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Goog-User-Project: ${PROJECT_ID}" \
  -d "${REQUEST_BODY}" \
  "${API_URL}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Datastore creation initiated!"
    echo ""
    ENGINE_ID="$DATA_STORE_ID"
    echo "🎯 ENGINE_ID: $ENGINE_ID"
    echo ""
elif [ "$HTTP_CODE" = "409" ]; then
    echo "✅ Datastore already exists!"
    echo ""
    ENGINE_ID="$DATA_STORE_ID"
    echo "🎯 ENGINE_ID: $ENGINE_ID"
    echo ""
else
    echo "❌ Error creating datastore (HTTP $HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    exit 1
fi

# Step 5: Import documents from GCS
echo "📥 Step 5: Importing documents from GCS bucket..."
echo ""
echo "   This may take a few minutes..."
echo ""

IMPORT_API_URL="https://discoveryengine.googleapis.com/v1alpha/projects/${PROJECT_ID}/locations/${LOCATION}/collections/${COLLECTION_ID}/dataStores/${DATA_STORE_ID}/branches/0/documents:import"

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
IMPORT_BODY=$(echo "$IMPORT_RESPONSE" | sed '$d')

if [ "$IMPORT_HTTP_CODE" = "200" ] || [ "$IMPORT_HTTP_CODE" = "202" ]; then
    echo "✅ Document import initiated!"
    echo ""
    echo "⏳ Indexing will take 5-10 minutes..."
    echo "   You can check status in the console:"
    echo "   https://console.cloud.google.com/gen-app-builder/data-stores?project=${PROJECT_ID}"
    echo ""
else
    echo "⚠️  Warning: Document import may have failed (HTTP $IMPORT_HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$IMPORT_BODY" | python3 -m json.tool 2>/dev/null || echo "$IMPORT_BODY"
    echo ""
    echo "💡 You can manually import documents later via the console"
    echo ""
fi

# Step 6: Update .env file
echo "📝 Step 6: Updating .env file with personal account details..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

# Backup current .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Update .env with personal account details
cat > .env <<EOF
# Environment Variables for Betty's Bird Boutique Agent
# Personal GCP Account Configuration

# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT=${PROJECT_ID}
GOOGLE_CLOUD_LOCATION=${LOCATION}

# Vertex AI Search Configuration
DATASTORE_PROJECT_ID=${PROJECT_ID}
DATASTORE_LOCATION=${LOCATION}
DATASTORE_ENGINE_ID=${ENGINE_ID}

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
echo "============================================================"
echo "✅ Setup Complete!"
echo "============================================================"
echo ""
echo "📋 Summary:"
echo "   Project ID: $PROJECT_ID"
echo "   Bucket: $BUCKET"
echo "   Datastore ENGINE_ID: $ENGINE_ID"
echo "   Location: $LOCATION"
echo ""
echo "⏳ Next Steps:"
echo "1. Wait 5-10 minutes for indexing to complete"
echo "2. Verify datastore status in console:"
echo "   https://console.cloud.google.com/gen-app-builder/data-stores?project=${PROJECT_ID}"
echo "3. Run: ./test_agent.sh (or start toolbox and run adk web)"
echo "4. When done, run: ./cleanup_personal_account.sh $PROJECT_ID"
echo ""
