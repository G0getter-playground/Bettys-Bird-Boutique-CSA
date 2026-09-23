# Troubleshooting Guide - Betty's Bird Boutique Agent

## Common Errors and Solutions

### 1. 429 RESOURCE_EXHAUSTED (Rate Limit)

**Error Message:**
```
429 RESOURCE_EXHAUSTED. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
```

**Cause:** ADK is using the free Gemini API (20 requests/day limit) instead of Vertex AI.

**Solution:**
1. Add to `.env`:
   ```bash
   GOOGLE_GENAI_USE_VERTEXAI=true
   ```

2. Enable Vertex AI API:
   ```bash
   gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
   ```

3. Re-authenticate:
   ```bash
   gcloud auth application-default login --project=YOUR_PROJECT_ID
   ```

4. Restart ADK server

---

### 2. 403 PERMISSION_DENIED (Vertex AI API)

**Error Message:**
```
403 PERMISSION_DENIED. Vertex AI API has not been used in project... or it is disabled
```

**Cause:** Vertex AI API is not enabled or you're authenticated with the wrong account.

**Solution:**
1. Login with correct account:
   ```bash
   gcloud auth login YOUR_EMAIL
   ```

2. Set project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. Enable API:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

4. Set up ADC:
   ```bash
   gcloud auth application-default login --project=YOUR_PROJECT_ID
   ```

---

### 3. "No module named 'datastore'" Error

**Error Message:**
```
Fail to load 'src' module. No module named 'datastore'
```

**Cause:** Python imports in agent.py are not relative when running from parent directory.

**Solution:**
Change imports in `agent.py` from:
```python
from datastore import get_datastore_search_tool
```
To:
```python
from .datastore import get_datastore_search_tool
```

---

### 4. Toolbox "environment variable not found" Error

**Error Message:**
```
unable to parse tool file: environment variable not found: "MYSQL_PASSWORD"
```

**Cause:** Environment variables not loaded before running toolbox.

**Solution:**
```bash
# Load env vars before running toolbox
set -a && source .env && set +a
toolbox --tools-file "tools.yaml"
```

---

### 5. ADK Shows Wrong Agents (docs, scripts, screenshots)

**Cause:** ADK scans all directories for potential agents.

**Solution:** Select **"src"** from the dropdown - that's the actual agent.

---

### 6. Database Query Returns No Results

**Cause:** Product name doesn't exist in database.

**Available Products:**
- Bird Seed Mix ($15.99)
- Sunflower Seeds ($22.50)
- Suet Cakes ($12.75)
- Bird Feeder ($25.00)
- Bluebird House ($35.50)
- Bird Bath ($75.99)
- Cuttlebone ($4.25)
- Millet ($8.00)
- Parrot Pellets ($28.99)
- Finch & Canary Food ($10.50)

**Note:** "Bird Cage" is NOT in the database.

---

## Quick Start Commands

```bash
# Terminal 1: Start Toolbox
cd /path/to/betty-bird-boutique/src
set -a && source .env && set +a
toolbox --tools-file "tools.yaml"

# Terminal 2: Start ADK
cd /path/to/betty-bird-boutique
set -a && source src/.env && set +a
adk web

# Browser: http://127.0.0.1:8000
# Select "src" agent
```

---

## Environment Setup Checklist

- [ ] `.env` file exists in `src/` directory
- [ ] `GOOGLE_GENAI_USE_VERTEXAI=true` is set
- [ ] Vertex AI API is enabled
- [ ] ADC authenticated with correct project
- [ ] Toolbox server running on port 5000
- [ ] ADK server running on port 8000
