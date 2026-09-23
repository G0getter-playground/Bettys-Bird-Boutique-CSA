# Betty's Bird Boutique - Quick Start Guide

## Cost Management ⚠️

**IMPORTANT**: Always stop resources when not in use to save your Udacity budget ($25)!

```bash
cd starter

# Check what's running
./status.sh

# Start resources before testing
./start.sh

# Stop resources after testing (SAVES MONEY!)
./stop.sh
```

## Complete Workflow

1. **Start resources**:
   ```bash
   cd starter
   ./start.sh
   ```

2. **Start MCP Toolbox server** (in terminal 1):
   ```bash
   ./toolbox --tools-file "tools.yaml"
   ```

3. **Run the agent** (in terminal 2):
   ```bash
   adk web
   ```

4. **Test the agent** in your browser

5. **Stop resources** when done:
   ```bash
   ./stop.sh
   ```

## Resources Managed

- **Cloud SQL MySQL**: Started/stopped by scripts
- **MCP Toolbox Server**: Local process (run manually, check with `./status.sh`)
- **Vertex AI Search**: Will be added when datastore is set up

## Installation

Install dependencies using `uv`:
```bash
uv pip install -r requirements.txt
```

## Troubleshooting

- **Authentication errors**: Run `gcloud auth application-default login`
- **Instance not found**: Check instance name in scripts matches your GCP instance
- **Port 5000 in use**: Stop existing MCP Toolbox server or change port in `.env`
