#!/usr/bin/env python3
"""
Standalone Kafka Connection Verification Script for PATRONET.
Verifies connectivity to the existing Aiven Apache Kafka service.

Safety and non-destructive design:
- Does NOT create or alter topics.
- Does NOT publish or produce messages.
- Does NOT consume messages or change consumer offsets.
- Does NOT modify any configuration or existing data.
- Does NOT print passwords, tokens, or raw credentials.
"""
import os
import ssl
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure we load from patronet-backend/.env
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


def get_kafka_config():
    """Extract Kafka connection parameters safely from environment."""
    bootstrap = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "").strip()
    user = os.getenv("KAFKA_USERNAME", "").strip()
    password = os.getenv("KAFKA_PASSWORD", "").strip()
    security_protocol = os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL").strip()
    sasl_mechanism = os.getenv("KAFKA_SASL_MECHANISM", "PLAIN").strip()
    order_topic = os.getenv("KAFKA_ORDER_EVENTS_TOPIC", "patronet.order.events").strip()
    consumer_group = os.getenv("KAFKA_ORDER_EVENTS_CONSUMER_GROUP", "patronet-order-processors").strip()

    return {
        "bootstrap_servers": bootstrap,
        "username": user,
        "password": password,
        "security_protocol": security_protocol,
        "sasl_mechanism": sasl_mechanism,
        "order_topic": order_topic,
        "consumer_group": consumer_group,
    }


def main():
    print("=" * 65)
    print(" PATRONET — Kafka Service Connectivity Verification")
    print("=" * 65)

    config = get_kafka_config()

    if not config["bootstrap_servers"] or "localhost" in config["bootstrap_servers"]:
        print("\n[ERROR] Valid KAFKA_BOOTSTRAP_SERVERS is not configured.")
        print("Please check KAFKA_BOOTSTRAP_SERVERS in patronet-backend/.env")
        return 1

    # Safe display of configuration (NO secrets or passwords)
    print("\n[CONFIGURATION INSPECTED]")
    print(f"  Bootstrap Servers : {config['bootstrap_servers']}")
    print(f"  Security Protocol : {config['security_protocol']}")
    print(f"  SASL Mechanism    : {config['sasl_mechanism']}")
    print(f"  Username          : {config['username'] if config['username'] else 'None'}")
    print(f"  Password          : {'[CONFIGURED]' if config['password'] else '[NOT SET]'}")
    print(f"  Order Events Topic: {config['order_topic']}")
    print(f"  Consumer Group    : {config['consumer_group']}")

    # Client detection
    print("\n[CLIENT DETECTION]")
    try:
        import kafka
        from kafka.admin import KafkaAdminClient
        client_version = getattr(kafka, "__version__", "unknown")
        client_name = f"kafka-python-ng (v{client_version})"
        print(f"  Client Library    : {client_name}")
    except ImportError:
        print("  [ERROR] No Kafka client library found in the virtual environment.")
        return 1

    # Execute read-only connectivity verification
    print(f"\n[CONNECTING via {client_name}]...")
    try:
        # Create SSL context suitable for Aiven Kafka's TLS endpoint
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        admin = KafkaAdminClient(
            bootstrap_servers=config["bootstrap_servers"],
            security_protocol=config["security_protocol"],
            sasl_mechanism=config["sasl_mechanism"],
            sasl_plain_username=config["username"] if config["username"] else None,
            sasl_plain_password=config["password"] if config["password"] else None,
            ssl_context=ssl_ctx,
            request_timeout_ms=10000,
        )

        # 1. Describe cluster (safe read-only metadata)
        cluster_info = admin.describe_cluster()
        cluster_id = cluster_info.get("cluster_id", "Unknown")
        controller_id = cluster_info.get("controller_id", "Unknown")
        brokers = cluster_info.get("brokers", [])

        # 2. List topics (safe read-only metadata)
        all_topics = admin.list_topics()
        user_topics = [t for t in all_topics if not t.startswith("_")]

        admin.close()

        print("\n" + "-" * 65)
        print(" [RESULT] Kafka Connection Succeeded! \u2705")
        print("-" * 65)
        print(f"  Cluster ID        : {cluster_id}")
        print(f"  Controller ID     : {controller_id}")
        print(f"  Active Brokers    : {len(brokers)}")
        for b in brokers:
            print(f"    - Node ID {b.get('node_id')}: {b.get('host')}:{b.get('port')}")
        print(f"  Discovered Topics : {user_topics}")
        print(f"  Configured Topic  : '{config['order_topic']}' (Present: {config['order_topic'] in all_topics})")
        print("-" * 65)
        print("\nVerification successful: Kafka cluster is accessible, authenticated, and responsive.")
        return 0

    except Exception as exc:
        print("\n" + "-" * 65)
        print(" [RESULT] Kafka Connection Failed! \u274c")
        print("-" * 65)
        print(f"  Error Type   : {type(exc).__name__}")
        print(f"  Error Details: {exc}")
        print("-" * 65)
        return 1


if __name__ == "__main__":
    sys.exit(main())
