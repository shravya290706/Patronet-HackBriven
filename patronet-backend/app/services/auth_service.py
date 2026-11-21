"""
Authentication and Customer service logic including registration, login, and auth dependencies.
"""
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.customer import Customer
from app.repositories.customer_repository import CustomerRepository
from app.schemas.auth import (
    CustomerLoginRequest,
    CustomerRegisterRequest,
    CustomerResponse,
    TokenResponse,
)

logger = logging.getLogger(__name__)

# HTTPBearer extracts Authorization: Bearer <token>
_bearer_security = HTTPBearer(auto_error=False)


class AuthService:
    """Service layer handling registration, credential validation, and JWT issuing."""

    @staticmethod
    def register_customer(
        db: Session, req: CustomerRegisterRequest
    ) -> TokenResponse:
        """
        Register a new customer account.
        Raises 400 Bad Request if the email is already in use.
        """
        existing = CustomerRepository.get_by_email(db, req.email)
        if existing:
            logger.warning("Registration failed: email '%s' already exists", req.email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )

        password_hash = hash_password(req.password)
        customer = CustomerRepository.create(
            db=db,
            name=req.name,
            email=req.email,
            password_hash=password_hash,
            phone=req.phone,
        )

        access_token = create_access_token(
            subject=str(customer.id),
            extra_claims={"email": customer.email},
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            customer=CustomerResponse.model_validate(customer),
        )

    @staticmethod
    def authenticate_customer(
        db: Session, req: CustomerLoginRequest
    ) -> TokenResponse:
        """
        Authenticate customer credentials and return a signed JWT token.
        Raises 401 Unauthorized if email or password do not match.
        """
        customer = CustomerRepository.get_by_email(db, req.email)
        if not customer or not verify_password(req.password, customer.password_hash):
            logger.warning("Failed login attempt for email '%s'", req.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            subject=str(customer.id),
            extra_claims={"email": customer.email},
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            customer=CustomerResponse.model_validate(customer),
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_security),
    db: Session = Depends(get_db),
) -> Customer:
    """
    FastAPI dependency that extracts and validates Bearer token,
    returning the authenticated Customer entity from the database.
    Raises 401 Unauthorized if token is missing, invalid, expired, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise credentials_exception

    customer_id = payload.get("sub")
    if not customer_id:
        raise credentials_exception

    customer = CustomerRepository.get_by_id(db, customer_id)
    if not customer:
        raise credentials_exception

    return customer


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_security),
    db: Session = Depends(get_db),
) -> Optional[Customer]:
    """
    FastAPI dependency that returns the authenticated Customer if valid Bearer token
    is provided, or None if anonymous/unauthenticated.
    """
    if not credentials or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None

    customer_id = payload.get("sub")
    if not customer_id:
        return None

    return CustomerRepository.get_by_id(db, customer_id)

