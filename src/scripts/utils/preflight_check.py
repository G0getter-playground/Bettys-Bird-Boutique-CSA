#!/usr/bin/env python3
"""
Pre-flight check script to verify all dependencies and setup before testing.
Run this before starting the agent to ensure everything is configured correctly.
"""

import os
import sys
from pathlib import Path

def check_python_version():
    """Check Python version."""
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} (need 3.8+)")
        return False

def check_dependencies():
    """Check if required Python packages are installed."""
    required = [
        ('google.adk', 'ADK'),
        ('google.cloud.discoveryengine', 'Discovery Engine'),
        ('toolbox_core', 'MCP Toolbox Core'),
    ]
    all_ok = True
    for module, name in required:
        try:
            __import__(module)
            print(f"✅ {name} installed")
        except ImportError:
            print(f"❌ {name} NOT installed")
            all_ok = False
    return all_ok

def check_env_file():
    """Check .env file configuration."""
    script_dir = Path(__file__).parent.parent.parent
    env_path = script_dir / ".env"
    if not env_path.exists():
        print("❌ .env file not found")
        return False
    
    print("✅ .env file exists")
    
    # Read and check required variables
    required_vars = {
        'GOOGLE_CLOUD_PROJECT': None,
        'DATASTORE_PROJECT_ID': None,
        'DATASTORE_LOCATION': None,
        'DATASTORE_ENGINE_ID': 'your-engine-id-here',
        'MYSQL_HOST': 'your-mysql-host-ip',
        'MYSQL_USER': 'your-mysql-user',
        'MYSQL_PASSWORD': 'your-mysql-password',
        'TOOLBOX_URL': None,
    }
    
    with open(env_path) as f:
        env_content = f.read()
    
    missing = []
    unset = []
    for var, default_value in required_vars.items():
        if f"{var}=" not in env_content:
            missing.append(var)
        elif default_value and f"{var}={default_value}" in env_content:
            unset.append(var)
    
    if missing:
        print(f"❌ Missing variables: {', '.join(missing)}")
        return False
    
    if unset:
        print(f"⚠️  Unset variables (need values): {', '.join(unset)}")
        return False
    
    print("✅ All required .env variables are set")
    return True

def check_toolbox_command():
    """Check if MCP Toolbox command is available."""
    import subprocess
    result = subprocess.run(['which', 'toolbox'], 
                          capture_output=True, 
                          text=True)
    if result.returncode == 0:
        toolbox_path = result.stdout.strip()
        print(f"✅ MCP Toolbox found: {toolbox_path}")
        return True
    else:
        print("❌ MCP Toolbox command not found")
        print("   Install instructions:")
        print("   - Visit: https://github.com/google/mcp-toolbox")
        print("   - Or check Udacity course materials")
        return False

def check_tools_yaml():
    """Check if tools.yaml exists."""
    script_dir = Path(__file__).parent.parent.parent
    yaml_path = script_dir / "tools.yaml"
    if yaml_path.exists():
        print("✅ tools.yaml exists")
        return True
    else:
        print("❌ tools.yaml not found")
        return False

def check_gcloud_auth():
    """Check if gcloud is authenticated."""
    import subprocess
    result = subprocess.run(['gcloud', 'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'],
                          capture_output=True,
                          text=True)
    if result.returncode == 0 and result.stdout.strip():
        account = result.stdout.strip().split('\n')[0]
        print(f"✅ gcloud authenticated as: {account}")
        return True
    else:
        print("❌ gcloud not authenticated")
        print("   Run: gcloud auth application-default login")
        return False

def main():
    """Run all checks."""
    print("🔍 Pre-flight Check for Betty's Bird Boutique Agent\n")
    print("=" * 60)
    
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        (".env Configuration", check_env_file),
        ("MCP Toolbox", check_toolbox_command),
        ("tools.yaml", check_tools_yaml),
        ("gcloud Authentication", check_gcloud_auth),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n📋 {name}:")
        result = check_func()
        results.append(result)
    
    print("\n" + "=" * 60)
    print("\n📊 Summary:")
    
    if all(results):
        print("✅ All checks passed! Ready to start the agent.")
        print("\nNext steps:")
        print("1. Start Cloud SQL: ./start.sh")
        print("2. Start MCP Toolbox: ./toolbox --tools-file \"tools.yaml\"")
        print("3. Run agent: adk web")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
