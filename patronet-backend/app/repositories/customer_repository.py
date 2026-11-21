"""
Repository for Customer database queries and persistence.
"""
from datetime import datetime, timezone
from typing import Optional, Union
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.customer import Customer


class CustomerRepository:
    """Encapsulates database operations for Customer records."""

    @staticmethod
    def get_by_id(
        db: Session, customer_id: Union[UUID, str]
    ) -> Optional[Customer]:
        """Fetch customer by primary key UUID."""
        return db.query(Customer).filter(Customer.id == customer_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Customer]:
        """Fetch customer by case-insensitive email address."""
        normalized_email = email.strip().lower()
        return (
            db.query(Customer)
            .filter(func.lower(Customer.email) == normalized_email)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        name: str,
        email: str,
        password_hash: str,
        phone: Optional[str] = None,
    ) -> Customer:
        """Create and persist a new customer record."""
        now = datetime.now(timezone.utc)
        customer = Customer(
            name=name.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            phone=phone.strip() if phone and phone.strip() else None,
            created_at=now,
            updated_at=now,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
