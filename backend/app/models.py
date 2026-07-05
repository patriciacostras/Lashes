from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_id() -> str:
    return uuid.uuid4().hex


class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    duration_min: Mapped[int] = mapped_column(Integer)
    price_ron: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="service")


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        Index("ix_appointments_starts_ends", "starts_at", "ends_at"),
        Index("ix_appointments_service_id", "service_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    client_name: Mapped[str] = mapped_column(String(120))
    client_phone: Mapped[str] = mapped_column(String(40))
    client_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus), default=AppointmentStatus.PENDING
    )
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    service: Mapped[Service] = relationship(back_populates="appointments")


class BlockedSlot(Base):
    __tablename__ = "blocked_slots"
    __table_args__ = (Index("ix_blocked_slots_starts_ends", "starts_at", "ends_at"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
