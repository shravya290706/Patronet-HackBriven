"""
Centralized Gemini AI Service using the official `google-genai` SDK.
Provides synchronous structured AI generation for PATRONET USPs
(Comparor, Negotiator, Shopping Buddy) with caching, rate limit protection,
and seamless fallback when unconfigured or unavailable.
"""
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service layer interfacing with Google Gemini API via official google-genai SDK."""

    _client: Optional[genai.Client] = None
    _cache: Dict[str, Dict[str, Any]] = {}
    _cache_ttl_seconds: int = 600  # 10 minutes cache for identical comparison/query requests

    @classmethod
    def get_client(cls) -> Optional[genai.Client]:
        """Lazy-initialize and return the genai.Client instance."""
        if cls._client is not None:
            return cls._client

        api_key = (settings.GEMINI_API_KEY or "").strip()
        if not api_key:
            logger.info("Gemini API key is not configured; using deterministic fallback pipelines.")
            return None

        try:
            cls._client = genai.Client(api_key=api_key)
            return cls._client
        except Exception as e:
            logger.error("Failed to initialize Google GenAI Client: %s", str(e))
            return None

    @classmethod
    def is_available(cls) -> bool:
        """Check if Gemini API is configured with a key."""
        return bool((settings.GEMINI_API_KEY or "").strip())

    @classmethod
    def get_model_name(cls) -> str:
        """Return configured model name with sensible default."""
        return settings.GEMINI_MODEL or "gemini-2.5-flash"

    @classmethod
    def generate_json(
        cls,
        prompt: str,
        system_instruction: Optional[str] = None,
        cache_key: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Optional[Dict[str, Any]]:
        """
        Synchronously invoke Gemini to return structured JSON.
        Validates JSON parsing and returns None on error or unavailability.
        """
        # Check in-memory cache
        if cache_key and cache_key in cls._cache:
            entry = cls._cache[cache_key]
            if (datetime.now(timezone.utc).timestamp() - entry["timestamp"]) < cls._cache_ttl_seconds:
                logger.debug("Cache hit for Gemini request: %s", cache_key)
                return entry["data"]

        client = cls.get_client()
        if not client:
            return None

        model_name = cls.get_model_name()
        config = types.GenerateContentConfig(
            temperature=temperature,
            response_mime_type="application/json",
            system_instruction=system_instruction,
        )

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            if not response or not response.text:
                logger.warning("Empty response from Gemini API.")
                return None

            raw_text = response.text.strip()
            # Clean possible markdown wrapping if SDK returned json with fences
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1]
                if raw_text.endswith("```"):
                    raw_text = raw_text.rsplit("\n", 1)[0]
                raw_text = raw_text.strip()

            parsed = json.loads(raw_text)
            if isinstance(parsed, dict):
                if cache_key:
                    cls._cache[cache_key] = {
                        "timestamp": datetime.now(timezone.utc).timestamp(),
                        "data": parsed,
                    }
                return parsed
            else:
                logger.warning("Gemini did not return a JSON object: %s", type(parsed))
                return None

        except APIError as e:
            logger.warning("Gemini API error (%s); falling back to deterministic engine.", str(e))
            return None
        except json.JSONDecodeError as e:
            logger.warning("Failed to decode JSON from Gemini output: %s", str(e))
            return None
        except Exception as e:
            logger.warning("Unexpected error during Gemini execution: %s", str(e))
            return None

    @classmethod
    def generate_text(
        cls,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.5,
    ) -> Optional[str]:
        """
        Synchronously invoke Gemini for freeform conversational text.
        Returns None on any error or missing key.
        """
        client = cls.get_client()
        if not client:
            return None

        model_name = cls.get_model_name()
        config = types.GenerateContentConfig(
            temperature=temperature,
            system_instruction=system_instruction,
        )

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            return response.text.strip() if response and response.text else None
        except Exception as e:
            logger.warning("Gemini generate_text failed: %s", str(e))
            return None
