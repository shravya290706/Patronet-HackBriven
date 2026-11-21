"""
Pydantic data schemas for Authentication (Register, Login, Customer profile, Token).
"""
from datetime import datetime
import re
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$"
)


class CustomerRegisterRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Full name of the customer",
        examples=["Jane Doe"],
    )
    email: str = Field(
        ...,
        description="Valid email address",
        examples=["jane.doe@example.com"],
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Password (minimum 6 characters)",
        examples=["SecurePass123!"],
    )
    phone: Optional[str] = Field(
        None,
        max_length=20,
        description="Optional phone number",
        examples=["+15551234567"],
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Name cannot be empty or whitespace only")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email format")
        return cleaned

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned if cleaned else None


class CustomerLoginRequest(BaseModel):
    email: str = Field(
        ...,
        description="Registered email address",
        examples=["jane.doe@example.com"],
    )
    password: str = Field(
        ...,
        min_length=1,
        description="Customer password",
        examples=["SecurePass123!"],
    )

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email format")
        return cleaned


class CustomerResponse(BaseModel):
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerResponse
