"""
Kafka producer manager and client lifecycle management for PATRONET.
Provides safe SASL_SSL/PLAIN authentication and TLS configuration for Aiven Kafka.
"""
import logging
import ssl
from typing import Optional
from kafka import KafkaProducer
from app.core.config import settings
from app.schemas.events import serialize_event_payload, serialize_message_key

logger = logging.getLogger("patronet.kafka")


class KafkaProducerManager:
    """
    Manages the lifecycle, configuration, and instance of KafkaProducer.
    Thread-safe and integrated with FastAPI application lifecycle.
    """

    def __init__(self) -> None:
        self._producer: Optional[KafkaProducer] = None
        self._is_started: bool = False

    def _create_ssl_context(self) -> ssl.SSLContext:
        """
        Create an SSL context compatible with Aiven Kafka's self-signed project certificate.
        """
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        return ssl_ctx

    def start(self) -> None:
        """
        Initialize and connect the Kafka producer.
        Safe against startup failures: logs warnings without exposing credentials.
        """
        if self._producer is not None:
            return

        bootstrap_servers = settings.KAFKA_BOOTSTRAP_SERVERS
        if not bootstrap_servers or "localhost" in bootstrap_servers:
            logger.warning(
                "Kafka bootstrap servers not set or points to localhost (%s). "
                "Producer initialization skipped.",
                bootstrap_servers,
            )
            return

        security_protocol = settings.KAFKA_SECURITY_PROTOCOL
        sasl_mechanism = settings.KAFKA_SASL_MECHANISM
        username = settings.KAFKA_USERNAME
        password = settings.KAFKA_PASSWORD

        logger.info(
            "Initializing Kafka producer targeting servers=%s protocol=%s mechanism=%s auth_user=%s",
            bootstrap_servers,
            security_protocol,
            sasl_mechanism,
            username if username else "None",
        )

        try:
            ssl_ctx = self._create_ssl_context() if "SSL" in security_protocol else None

            self._producer = KafkaProducer(
                bootstrap_servers=bootstrap_servers,
                security_protocol=security_protocol,
                sasl_mechanism=sasl_mechanism if username else None,
                sasl_plain_username=username if username else None,
                sasl_plain_password=password if password else None,
                ssl_context=ssl_ctx,
                key_serializer=serialize_message_key,
                value_serializer=serialize_event_payload,
                acks="all",
                retries=3,
                request_timeout_ms=10000,
                max_block_ms=10000,
            )
            self._is_started = True
            logger.info("Kafka producer initialized and connected successfully.")
        except Exception as exc:
            self._producer = None
            self._is_started = False
            logger.error(
                "Failed to initialize Kafka producer for servers=%s: %s",
                bootstrap_servers,
                type(exc).__name__,
            )

    def stop(self, timeout: float = 5.0) -> None:
        """
        Gracefully flush and close the Kafka producer.
        """
        if self._producer is not None:
            logger.info("Closing Kafka producer with timeout=%.1fs...", timeout)
            try:
                self._producer.flush(timeout=timeout)
                self._producer.close(timeout=timeout)
                logger.info("Kafka producer closed cleanly.")
            except Exception as exc:
                logger.warning("Error closing Kafka producer: %s", type(exc).__name__)
            finally:
                self._producer = None
                self._is_started = False

    def get_producer(self) -> Optional[KafkaProducer]:
        """
        Get the active producer instance. Initializes on-demand if needed.
        """
        if self._producer is None and not self._is_started:
            self.start()
        return self._producer

    def is_healthy(self) -> bool:
        """Check if the producer instance exists and is running."""
        return self._producer is not None


# Global singleton manager instance
kafka_producer_manager = KafkaProducerManager()


def get_kafka_producer() -> Optional[KafkaProducer]:
    """Dependency helper to obtain the active Kafka producer."""
    return kafka_producer_manager.get_producer()
