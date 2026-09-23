#!/bin/bash
# Convenience script to run the Betty Bird Boutique agent demo

# Ensure we are in the project root
cd "$(dirname "$0")"

# Run the demo using the virtual environment python
./venv/bin/python -m src.run_demo
