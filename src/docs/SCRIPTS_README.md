# Script Organization Summary

## Directory Structure

```
starter/
├── run_project.sh              # Master script - runs entire workflow
├── scripts/
│   ├── personal-account/       # Personal GCP account scripts
│   │   ├── switch_to_personal_account.sh
│   │   ├── setup_personal_account.sh
│   │   ├── test_agent.sh
│   │   ├── cleanup_personal_account.sh
│   │   └── switch_back_to_udacity.sh
│   ├── cloud-sql/              # Cloud SQL management
│   │   ├── start.sh
│   │   ├── stop.sh
│   │   └── status.sh
│   └── utils/                  # Utility scripts
│       ├── preflight_check.py
│       └── setup_database.py
└── [other project files...]
```

## Quick Start

```bash
cd starter
./run_project.sh
```

This will:
1. Prompt for your personal GCP project ID
2. Switch to personal account
3. Set up all resources (APIs, bucket, datastore)
4. Start Cloud SQL
5. Wait for indexing
6. Test the agent
7. Clean up (optional)

## Manual Steps (if needed)

```bash
# Step 1: Switch to personal account
./scripts/personal-account/switch_to_personal_account.sh

# Step 2: Setup personal account
./scripts/personal-account/setup_personal_account.sh <your-project-id>

# Step 3: Start Cloud SQL
./scripts/cloud-sql/start.sh

# Step 4: Test agent (in separate terminal: start toolbox first)
./scripts/personal-account/test_agent.sh

# Step 5: Cleanup when done
./scripts/personal-account/cleanup_personal_account.sh <your-project-id>
./scripts/personal-account/switch_back_to_udacity.sh
```
