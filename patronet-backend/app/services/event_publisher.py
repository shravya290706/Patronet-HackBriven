"""
Reusable Event Publisher Service for PATRONET.
Publishes structured domain events to Apache Kafka topics with safe key handling and logging.
"""
import logging
from typing import Any, Dict, Optional
from app.core.config import settings
from app.core.kafka import kafka_producer_manager
from app.schemas.events import EventEnvelope

logger = logging.getLogger("patronet.event_publisher")


class KafkaUnavailableError(Exception):
    """Raised when the Kafka producer is not initialized or disconnected."""
    pass


class EventPublishError(Exception):
    """Raised when an error occurs during message dispatch or delivery."""
    pass


class EventPublisher:
    """
    Service responsible for publishing structured domain events to Kafka.
    """

    @classmethod
    def publish(
        cls,
        event_type: str,
        payload: Dict[str, Any],
        topic: Optional[str] = None,
        key: Optional[Any] = None,
        event_id: Optional[str] = None,
        sync: bool = False,
        timeout: float = 10.0,
    ) -> EventEnvelope:
        """
        Publish an event envelope to the specified Kafka topic.

        Args:
            event_type: Domain event name (e.g. order.created, product.indexed)
            payload: Data dictionary representing the event content
            topic: Target Kafka topic (defaults to KAFKA_ORDER_EVENTS_TOPIC)
            key: Optional message partition key (e.g. order_id, product_id)
            event_id: Optional explicit UUID (generated automatically if omitted)
            sync: If True, blocks until the broker acknowledges the write
            timeout: Timeout in seconds when sync is True

        Returns:
            The published EventEnvelope instance
        """
        target_topic = topic or settings.KAFKA_ORDER_EVENTS_TOPIC

        envelope_kwargs = {
            "event_type": event_type,
            "payload": payload,
        }
        if event_id:
            envelope_kwargs["event_id"] = str(event_id)

        envelope = EventEnvelope(**envelope_kwargs)

        producer = kafka_producer_manager.get_producer()
        if producer is None:
            logger.error(
                "Cannot publish event %s: Kafka producer is unavailable.",
                envelope.event_type,
            )
            raise KafkaUnavailableError(
                "Kafka producer is unavailable. Verify connection configuration."
            )

        key_str = str(key) if key is not None else None

        logger.debug(
            "Publishing event_id=%s type=%s topic=%s key=%s sync=%s",
            envelope.event_id,
            envelope.event_type,
            target_topic,
            key_str,
            sync,
        )

        try:
            future = producer.send(
                topic=target_topic,
                key=key_str,
                value=envelope,
            )

            if sync:
                record_metadata = future.get(timeout=timeout)
                logger.info(
                    "Event published synchronously: event_id=%s type=%s topic=%s partition=%d offset=%d",
                    envelope.event_id,
                    envelope.event_type,
                    record_metadata.topic,
                    record_metadata.partition,
                    record_metadata.offset,
                )
            else:
                logger.info(
                    "Event dispatched asynchronously: event_id=%s type=%s topic=%s",
                    envelope.event_id,
                    envelope.event_type,
                    target_topic,
                )

            return envelope

        except Exception as exc:
            logger.error(
                "Failed to publish event_id=%s type=%s to topic=%s: %s",
                envelope.event_id,
                envelope.event_type,
                target_topic,
                type(exc).__name__,
            )
            raise EventPublishError(
                f"Failed to publish event to topic '{target_topic}': {exc}"
            ) from exc

    @classmethod
    def publish_order_event(
        cls,
        event_type: str,
        payload: Dict[str, Any],
        order_id: Optional[Any] = None,
        sync: bool = False,
        timeout: float = 10.0,
    ) -> EventEnvelope:
        """
        Convenience method to publish order events to the configured order events topic,
        partitioned by order_id.
        """
        return cls.publish(
            event_type=event_type,
            payload=payload,
            topic=settings.KAFKA_ORDER_EVENTS_TOPIC,
            key=order_id,
            sync=sync,
            timeout=timeout,
        )
