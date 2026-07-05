from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import AppointmentStatus


class ServiceOut(BaseModel):
    id: str
    name: str
    description: str
    duration_min: int = Field(serialization_alias="durationMin")
    price_ron: int = Field(serialization_alias="priceRon")

    model_config = {"from_attributes": True, "populate_by_name": True}


class ServicesResponse(BaseModel):
    services: list[ServiceOut]


class BlockedSlotOut(BaseModel):
    id: str
    reason: Optional[str]
    starts_at: datetime = Field(serialization_alias="startsAt")
    ends_at: datetime = Field(serialization_alias="endsAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class BlockedSlotsResponse(BaseModel):
    blocked_slots: list[BlockedSlotOut] = Field(serialization_alias="blockedSlots")


class AppointmentCreate(BaseModel):
    client_name: str = Field(min_length=2, max_length=120, validation_alias="clientName")
    client_phone: str = Field(min_length=7, max_length=40, validation_alias="clientPhone")
    client_email: Optional[EmailStr] = Field(default=None, validation_alias="clientEmail")
    notes: Optional[str] = Field(default=None, max_length=500)
    service_id: str = Field(validation_alias="serviceId")
    starts_at: datetime = Field(validation_alias="startsAt")

    model_config = {"populate_by_name": True}


class AppointmentOut(BaseModel):
    id: str
    client_name: str = Field(serialization_alias="clientName")
    client_phone: str = Field(serialization_alias="clientPhone")
    client_email: Optional[str] = Field(serialization_alias="clientEmail")
    notes: Optional[str]
    starts_at: datetime = Field(serialization_alias="startsAt")
    ends_at: datetime = Field(serialization_alias="endsAt")
    status: AppointmentStatus
    service: ServiceOut

    model_config = {"from_attributes": True, "populate_by_name": True}


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
