# Personal GCP Account Setup Guide

This guide helps you quickly set up the Betty's Bird Boutique agent using your personal GCP account to bypass Udacity's organizational policy restrictions.

## Quick Start

1. **Switch to personal account:**
   ```bash
   cd starter
   export PERSONAL_PROJECT_ID="your-project-id"
   ./switch_to_personal_account.sh
   ```
   Or:
   ```bash
   ./switch_to_personal_account.sh
   # Enter your project ID when prompted
   ```

2. **Complete setup:**
   ```bash
   ./setup_personal_account.sh $PERSONAL_PROJECT_ID
   ```
   This will:
   - Enable required APIs (Discovery Engine, Storage, SQL Admin)
   - Create GCS bucket and upload PDFs
   - Create Vertex AI Search datastore
   - Update `.env` with your project details

3. **Wait for indexing** (5-10 minutes):
   - Check status: https://console.cloud.google.com/gen-app-builder/data-stores?project=$PROJECT_ID
   - Wait until status shows "Ready" or "Indexed"

4. **Test the agent:**
   ```bash
   # Terminal 1: Start toolbox server
   ./toolbox --tools-file "tools.yaml"
   
   # Terminal 2: Start agent
   ./test_agent.sh
   # Or: adk web
   ```

5. **Capture screenshots** for submission:
   - Root agent with session ID
   - Database tool usage (product price query)
   - Datastore tool usage (store information query)
   - Web search tool usage (general bird knowledge)
   - Guardrail enforcement (off-topic rejection)

6. **Cleanup when done:**
   ```bash
   ./cleanup_personal_account.sh $PERSONAL_PROJECT_ID
   ```

7. **Switch back to Udacity account:**
   ```bash
   ./switch_back_to_udacity.sh
   ```

## Detailed Steps

### Prerequisites

- Personal GCP account with billing enabled
- `gcloud` CLI installed and authenticated
- Project ID where you have Owner or Editor permissions

### Step-by-Step Process

#### 1. Authentication & Project Setup

The `switch_to_personal_account.sh` script will:
- Prompt you to authenticate with your personal Google account
- Set up Application Default Credentials (ADC)
- Configure `gcloud` to use your personal project
- Backup your current `.env` file as `.env.udacity`

#### 2. Resource Setup

The `setup_personal_account.sh` script automates:

**APIs Enabled:**
- `discoveryengine.googleapis.com` (Vertex AI Search)
- `storage.googleapis.com` (Cloud Storage)
- `sqladmin.googleapis.com` (Cloud SQL - if needed)

**GCS Bucket:**
- Creates: `gs://betty-bird-boutique-docs`
- Location: `us-central1` (regional)
- Uploads 3 PDF files:
  - `bettys-history.pdf`
  - `bettys-hours.pdf`
  - `bettys-staff.pdf`

**Vertex AI Search Datastore:**
- ID: `betty-bird-boutique-datastore`
- Location: `global` (no org policy restrictions!)
- Imports documents from GCS automatically

**Environment Configuration:**
- Updates `.env` with your project ID and ENGINE_ID
- Keeps MySQL connection (using Udacity Cloud SQL for testing)

#### 3. Testing

**Test Queries:**

1. **Database Tool:**
   - "What's the price of a bird cage?"
   - "How much does a perch cost?"

2. **Datastore Tool:**
   - "What are your store hours?"
   - "Who is Betty?"
   - "Tell me about the store history"

3. **Web Search Tool:**
   - "What kind of bird did Betty own?"
   - "What do parakeets eat?"

4. **Guardrails:**
   - "Tell me about politics"
   - "Order me a bird"

#### 4. Screenshots Checklist

Capture screenshots showing:

- [ ] **Agent Interface:** Root agent with session ID visible
- [ ] **Database Query:** Product price query with tool call details showing MySQL query
- [ ] **Datastore Query:** Store information query with tool call details showing Vertex AI Search
- [ ] **Web Search:** General bird knowledge query with citations
- [ ] **Guardrail:** Off-topic question rejection with appropriate message

#### 5. Cost Management

**Estimated Costs (Personal Account):**
- Vertex AI Search: ~$0.50-$1.00 per month (free tier includes 100 queries/day)
- Cloud Storage: ~$0.02 per month (minimal storage)
- **Total: ~$1-2 for testing session**

**Important:** Run `cleanup_personal_account.sh` when done to avoid ongoing charges!

### Troubleshooting

**Issue: "Permission denied"**
- Ensure you're authenticated: `gcloud auth application-default login`
- Verify project ID: `gcloud config get-value project`

**Issue: "API not enabled"**
- Script should enable APIs automatically
- Manually enable: `gcloud services enable discoveryengine.googleapis.com --project=$PROJECT_ID`

**Issue: "Datastore not indexing"**
- Wait 5-10 minutes for initial indexing
- Check console for errors
- Verify PDFs are in GCS bucket: `gsutil ls gs://betty-bird-boutique-docs`

**Issue: "Toolbox connection failed"**
- Ensure toolbox is running: `./toolbox --tools-file "tools.yaml"`
- Check it's listening: `curl http://127.0.0.1:5000/health`

### Scripts Reference

| Script | Purpose |
|--------|---------|
| `switch_to_personal_account.sh` | Switch to personal GCP account |
| `setup_personal_account.sh` | Complete setup (APIs, bucket, datastore) |
| `test_agent.sh` | Quick test launcher |
| `cleanup_personal_account.sh` | Delete all resources |
| `switch_back_to_udacity.sh` | Restore Udacity account |

### Environment Variables

After setup, your `.env` will contain:

```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
DATASTORE_PROJECT_ID=your-project-id
DATASTORE_LOCATION=global
DATASTORE_ENGINE_ID=betty-bird-boutique-datastore
MYSQL_HOST=35.226.62.44  # Udacity Cloud SQL (shared)
MYSQL_USER=betty_user
MYSQL_PASSWORD=Cc6hD88gWlK9oBwm
TOOLBOX_URL=http://127.0.0.1:5000
```

### Notes

- **MySQL Database:** Still uses Udacity Cloud SQL instance (shared for testing)
- **Personal Account:** Only Vertex AI Search uses your personal account
- **Cost:** Minimal (~$1-2) for testing session
- **Cleanup:** Always run cleanup script when done!

## Next Steps After Testing

1. Save all screenshots to `screenshots/` directory
2. Update `memory/progress.md` with testing results
3. Run cleanup script to delete resources
4. Switch back to Udacity account
5. Submit project with screenshots
