"""
API route definitions for Customer Authentication (Register, Login, Me).
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.auth import (
    CustomerLoginRequest,
    CustomerRegisterRequest,
    CustomerResponse,
    TokenResponse,
)
from app.services.auth_service import AuthService, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new customer",
    description="Register a new customer account with name, email, password, and optional phone. Returns JWT token and profile.",
)
def register(
    req: CustomerRegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    return AuthService.register_customer(db=db, req=req)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Customer login",
    description="Authenticate an existing customer via email and password. Returns JWT access token and profile.",
)
def login(
    req: CustomerLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    return AuthService.authenticate_customer(db=db, req=req)


@router.get(
    "/me",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current customer profile",
    description="Fetch the authenticated customer's profile using Bearer JWT authorization.",
)
def get_me(
    current_user: Customer = Depends(get_current_user),
) -> CustomerResponse:
    return CustomerResponse.model_validate(current_user)
