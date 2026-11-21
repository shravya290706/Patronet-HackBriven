"""
OpenSearch client provider and configuration for PATRONET.
"""
import logging
from typing import Optional
from urllib.parse import urlparse
from opensearchpy import OpenSearch
from app.core.config import settings

logger = logging.getLogger("patronet.opensearch")

_client: Optional[OpenSearch] = None


def get_opensearch_index_name() -> str:
    """Return the dedicated PATRONET products index name."""
    return settings.OPENSEARCH_INDEX_NAME


def get_opensearch_client() -> OpenSearch:
    """
    Get or create a singleton OpenSearch client configured from environment variables.
    Never exposes passwords or sensitive credentials in logs or exceptions.
    """
    global _client
    if _client is not None:
        return _client

    opensearch_url = settings.OPENSEARCH_URL.strip() if settings.OPENSEARCH_URL else ""
    host = settings.OPENSEARCH_HOST.strip() if settings.OPENSEARCH_HOST else ""
    port = settings.OPENSEARCH_PORT
    user = settings.OPENSEARCH_USERNAME.strip() if settings.OPENSEARCH_USERNAME else ""
    password = settings.OPENSEARCH_PASSWORD.strip() if settings.OPENSEARCH_PASSWORD else ""
    use_ssl = settings.OPENSEARCH_USE_SSL

    # Prefer parsed URL if provided and not pointing to localhost placeholder
    if opensearch_url and "localhost" not in opensearch_url:
        parsed = urlparse(opensearch_url)
        scheme = parsed.scheme or ("https" if use_ssl else "http")
        hostname = parsed.hostname or host
        port_num = parsed.port or port
        username = parsed.username or user
        pwd = parsed.password or password
        use_ssl = scheme == "https"
    else:
        hostname = host
        port_num = port
        username = user
        pwd = password

    http_auth = (username, pwd) if (username and pwd) else None

    logger.info(
        "Initializing OpenSearch client targeting host=%s port=%s use_ssl=%s auth_configured=%s",
        hostname,
        port_num,
        use_ssl,
        bool(http_auth),
    )

    _client = OpenSearch(
        hosts=[{"host": hostname, "port": port_num}],
        http_auth=http_auth,
        use_ssl=use_ssl,
        verify_certs=True,
        ssl_assert_hostname=False,
        ssl_show_warn=False,
        timeout=15,
        max_retries=3,
        retry_on_timeout=True,
    )

    return _client
