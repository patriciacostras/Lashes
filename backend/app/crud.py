from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from app.models import Appointment, AppointmentStatus, BlockedSlot, Service
from app.services_seed import DEFAULT_SERVICES


def sync_default_services(db: Session) -> None:
    existing = {service.name: service for service in db.scalars(select(Service)).all()}
    active_names = {service["name"] for service in DEFAULT_SERVICES}

    for service_data in DEFAULT_SERVICES:
        service = existing.get(service_data["name"])
        if service:
            service.description = service_data["description"]
            service.duration_min = service_data["duration_min"]
            service.price_ron = service_data["price_ron"]
            service.is_active = True
        else:
            db.add(Service(**service_data, is_active=True))

    db.execute(update(Service).where(Service.name.not_in(active_names)).values(is_active=False))
    db.commit()


def list_active_services(db: Session) -> list[Service]:
    return list(db.scalars(select(Service).where(Service.is_active.is_(True)).order_by(Service.price_ron)))


def get_service(db: Session, service_id: str) -> Optional[Service]:
    return db.get(Service, service_id)


def has_booking_conflict(db: Session, starts_at: datetime, ends_at: datetime) -> bool:
    appointment = db.scalar(
        select(Appointment).where(
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            Appointment.starts_at < ends_at,
            Appointment.ends_at > starts_at,
        )
    )
    if appointment:
        return True

    blocked = db.scalar(
        select(BlockedSlot).where(BlockedSlot.starts_at < ends_at, BlockedSlot.ends_at > starts_at)
    )
    return blocked is not None


def create_appointment(
    db: Session,
    *,
    service: Service,
    client_name: str,
    client_phone: str,
    client_email: Optional[str],
    notes: Optional[str],
    starts_at: datetime,
    ends_at: datetime,
) -> Appointment:
    appointment = Appointment(
        service_id=service.id,
        client_name=client_name,
        client_phone=client_phone,
        client_email=client_email,
        notes=notes,
        starts_at=starts_at,
        ends_at=ends_at,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def list_appointments(db: Session) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment)
            .options(joinedload(Appointment.service))
            .order_by(Appointment.starts_at.desc())
            .limit(100)
        )
    )


def update_appointment_status(
    db: Session, appointment_id: str, status: AppointmentStatus
) -> Optional[Appointment]:
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        return None
    appointment.status = status
    db.commit()
    db.refresh(appointment)
    return appointment


def list_blocked_slots(db: Session, starts_at: datetime, ends_at: datetime) -> list[BlockedSlot]:
    return list(
        db.scalars(
            select(BlockedSlot)
            .where(BlockedSlot.starts_at < ends_at, BlockedSlot.ends_at > starts_at)
            .order_by(BlockedSlot.starts_at.asc())
        )
    )


def create_blocked_slot(
    db: Session,
    *,
    starts_at: datetime,
    ends_at: datetime,
    reason: Optional[str],
) -> BlockedSlot:
    blocked_slot = BlockedSlot(starts_at=starts_at, ends_at=ends_at, reason=reason)
    db.add(blocked_slot)
    db.commit()
    db.refresh(blocked_slot)
    return blocked_slot
