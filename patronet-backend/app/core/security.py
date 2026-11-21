"""
Security utilities: Argon2 password hashing/verification and PyJWT token generation/decoding.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import argon2
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
import jwt
from app.core.config import settings

# Initialize Argon2 password hasher (defaults to Argon2id)
_hasher = argon2.PasswordHasher()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2id.
    """
    return _hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against an Argon2 hash.
    Returns True if matched, False otherwise.
    """
    try:
        return _hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    except Exception:
        return False


def create_access_token(
    subject: Union[str, Any],
    extra_claims: Optional[dict] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generate a signed JWT access token.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.
    Returns payload dictionary if valid, or None if expired/invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None
