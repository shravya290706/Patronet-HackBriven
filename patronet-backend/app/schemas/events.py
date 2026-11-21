"""
Event schemas and serialization utilities for PATRONET event streaming.
"""
from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, Field


def default_json_serializer(obj: Any) -> Any:
    """
    JSON serializer helper for objects not serializable by default json code
    such as datetime, UUID, and Decimal.
    """
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    if isinstance(obj, (uuid.UUID,)):
        return str(obj)
    if isinstance(obj, (Decimal,)):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def serialize_event_payload(data: Any) -> bytes:
    """Serialize event data dictionary or EventEnvelope model to UTF-8 JSON bytes."""
    if isinstance(data, BaseModel):
        data_dict = data.model_dump()
    elif isinstance(data, dict):
        data_dict = data
    else:
        raise ValueError(f"Expected dict or BaseModel, got {type(data)}")

    return json.dumps(data_dict, default=default_json_serializer).encode("utf-8")


def serialize_message_key(key: Optional[Any]) -> Optional[bytes]:
    """Safely serialize partition key to UTF-8 bytes."""
    if key is None:
        return None
    if isinstance(key, bytes):
        return key
    return str(key).encode("utf-8")


class EventEnvelope(BaseModel):
    """
    Standard event envelope structure for all domain events published to Kafka.
    """
    event_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique UUID identifying this event instance",
    )
    event_type: str = Field(
        ...,
        description="Domain event type identifier (e.g. order.created, order.paid)",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="UTC event creation timestamp formatted as ISO-8601",
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Event payload containing domain data",
    )
