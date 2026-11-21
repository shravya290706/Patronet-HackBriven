#!/usr/bin/env python3
"""
Standalone OpenSearch Connection Verification Script for PATRONET.
Verifies connectivity to the existing Aiven OpenSearch service.

Security notice:
- Does NOT print passwords, tokens, credentials, or full authenticated URLs.
- Does NOT create, alter, or delete any indices or documents.
"""
import base64
import json
import os
import ssl
import sys
from pathlib import Path
from urllib.parse import urlparse
import urllib.request
from dotenv import load_dotenv

# Ensure we load from patronet-backend/.env
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


def get_opensearch_config():
    """Extract OpenSearch connection parameters safely from environment."""
    opensearch_url = os.getenv("OPENSEARCH_URL", "").strip()

    host = os.getenv("OPENSEARCH_HOST", "").strip()
    port = os.getenv("OPENSEARCH_PORT", "13323").strip()
    user = os.getenv("OPENSEARCH_USERNAME", "").strip()
    password = os.getenv("OPENSEARCH_PASSWORD", "").strip()
    use_ssl_env = os.getenv("OPENSEARCH_USE_SSL", "true").strip().lower() in ("true", "1", "yes")

    if opensearch_url and "localhost" not in opensearch_url:
        parsed = urlparse(opensearch_url)
        scheme = parsed.scheme or ("https" if use_ssl_env else "http")
        hostname = parsed.hostname or host
        port_num = parsed.port or (int(port) if port else 443)
        username = parsed.username or user
        pwd = parsed.password or password
        use_ssl = scheme == "https"
    else:
        scheme = "https" if use_ssl_env else "http"
        hostname = host
        port_num = int(port) if port else 13323
        username = user
        pwd = password
        use_ssl = use_ssl_env

    return {
        "scheme": scheme,
        "host": hostname,
        "port": port_num,
        "username": username,
        "password": pwd,
        "use_ssl": use_ssl,
    }


def test_with_opensearch_py(config):
    """Attempt connection using opensearch-py library if installed."""
    try:
        from opensearchpy import OpenSearch
    except ImportError:
        return None

    client = OpenSearch(
        hosts=[{"host": config["host"], "port": config["port"]}],
        http_auth=(config["username"], config["password"]) if config["username"] else None,
        use_ssl=config["use_ssl"],
        verify_certs=True,
        ssl_assert_hostname=False,
        ssl_show_warn=False,
        timeout=10,
    )
    info = client.info()
    health = client.cluster.health()
    return {"info": info, "health": health}


def test_with_urllib(config):
    """Test connection using standard library urllib.request."""
    base_endpoint = f"{config['scheme']}://{config['host']}:{config['port']}"

    headers = {"Accept": "application/json"}
    if config["username"] and config["password"]:
        auth_string = f"{config['username']}:{config['password']}"
        auth_bytes = base64.b64encode(auth_string.encode("utf-8")).decode("ascii")
        headers["Authorization"] = f"Basic {auth_bytes}"

    ctx = ssl.create_default_context()
    if not config["use_ssl"]:
        ctx = None

    # 1. Fetch cluster info (GET /)
    req_info = urllib.request.Request(f"{base_endpoint}/", headers=headers)
    with urllib.request.urlopen(req_info, context=ctx, timeout=10) as resp:
        info_data = json.loads(resp.read().decode("utf-8"))

    # 2. Fetch cluster health (GET /_cluster/health)
    req_health = urllib.request.Request(f"{base_endpoint}/_cluster/health", headers=headers)
    with urllib.request.urlopen(req_health, context=ctx, timeout=10) as resp:
        health_data = json.loads(resp.read().decode("utf-8"))

    return {"info": info_data, "health": health_data}


def main():
    print("=" * 65)
    print(" PATRONET — OpenSearch Service Connectivity Verification")
    print("=" * 65)

    config = get_opensearch_config()

    if not config["host"]:
        print("\n[ERROR] OpenSearch host is not configured.")
        print("Please check OPENSEARCH_HOST or OPENSEARCH_URL in patronet-backend/.env")
        sys.exit(1)

    # Safe display of configuration (NO passwords, tokens, or raw credentials)
    print("\n[CONFIGURATION INSPECTED]")
    print(f"  Target Host  : {config['host']}")
    print(f"  Target Port  : {config['port']}")
    print(f"  Protocol     : {config['scheme'].upper()} (SSL: {config['use_ssl']})")
    print(f"  Auth Config  : {'Basic Authentication (configured)' if config['username'] else 'None'}")
    print(f"  Safe Endpoint: {config['scheme']}://{config['host']}:{config['port']}")

    # Determine client library
    print("\n[CLIENT DETECTION]")
    try:
        import opensearchpy
        client_name = f"opensearch-py (v{getattr(opensearchpy, '__version__', 'unknown')})"
        use_py_client = True
        print(f"  Available Client: {client_name}")
    except ImportError:
        client_name = "urllib.request (Python standard library REST client)"
        use_py_client = False
        print(f"  Installed Client: None of ('opensearch-py', 'elasticsearch') found in venv.")
        print(f"  Available Client: {client_name}")

    # Execute connection verification
    print(f"\n[CONNECTING via {client_name}]...")
    try:
        if use_py_client:
            res = test_with_opensearch_py(config)
        else:
            res = test_with_urllib(config)

        info = res.get("info", {})
        health = res.get("health", {})

        print("\n" + "-" * 65)
        print(" [RESULT] OpenSearch Connection Succeeded! \u2705")
        print("-" * 65)
        print(f"  Cluster Name        : {info.get('cluster_name', health.get('cluster_name', 'Unknown'))}")
        print(f"  Cluster Status      : {health.get('status', 'Unknown').upper()}")
        print(f"  OpenSearch Version  : {info.get('version', {}).get('number', 'Unknown')}")
        print(f"  Distribution        : {info.get('version', {}).get('distribution', 'opensearch')}")
        print(f"  Lucene Version      : {info.get('version', {}).get('lucene_version', 'Unknown')}")
        print(f"  Total Nodes         : {health.get('number_of_nodes', 'Unknown')}")
        print(f"  Data Nodes          : {health.get('number_of_data_nodes', 'Unknown')}")
        print(f"  Active Shards       : {health.get('active_shards', 'Unknown')}")
        print(f"  Tagline             : {info.get('tagline', '')}")
        print("-" * 65)
        print("\nVerification successful: Service is reachable, responsive, and healthy.")
        return 0

    except Exception as exc:
        print("\n" + "-" * 65)
        print(f" [RESULT] OpenSearch Connection Failed! \u274c")
        print("-" * 65)
        print(f"  Error Type   : {type(exc).__name__}")
        print(f"  Error Message: {exc}")
        print("-" * 65)
        return 1


if __name__ == "__main__":
    sys.exit(main())
