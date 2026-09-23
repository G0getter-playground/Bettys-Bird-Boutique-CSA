"""
Tool for accessing product database through MCP Toolbox.
"""
import os
from toolbox_core import ToolboxClient, ToolboxSyncClient
from toolbox_core.protocol import Protocol
from dotenv import load_dotenv

def get_database_tool():
    """
    """
    # Load env vars here to ensure they are available even if imported early
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    # Get toolbox URL from environment, default to localhost
    toolbox_url = os.environ.get("TOOLBOX_URL", "http://127.0.0.1:5000")
    print(f"DEBUG: toolbox_tools.py using URL: {toolbox_url}")
    # Ensure no trailing slash
    toolbox_url = toolbox_url.rstrip("/")
    
    try:
        # toolbox binary 0.5.0 speaks MCP 2024-11-05; pin the client to match.
        # Without this, toolbox-core 1.1.0 defaults to 2025-06-18 and the
        # handshake fails with "MCP version mismatch".
        db_client = ToolboxSyncClient(toolbox_url, protocol=Protocol.MCP_v20241105)
        # Load the tool defined in tools.yaml
        # The tool name should match what's defined in tools.yaml
        db_tool = db_client.load_tool("get-product-price")
        return db_tool
    except Exception as e:
        error_msg = (
            f"Error loading database tool: {e}\n"
            "Make sure:\n"
            "1. MCP Toolbox server is running: ./toolbox --tools-file 'tools.yaml'\n"
            "2. TOOLBOX_URL in .env matches the server URL\n"
            "3. MySQL connection variables (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD) are set in .env\n"
            "4. The Cloud SQL instance is running and accessible"
        )
        print(error_msg)
        # Return None if tool can't be loaded
        return None