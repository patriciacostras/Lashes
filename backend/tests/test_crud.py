from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import crud


def test_services_are_seeded_and_reseeded(db_session: Session) -> None:
    crud.sync_default_services(db_session)
    services = crud.list_active_services(db_session)
    assert len(services) == 13

    first = services[0]
    first.description = "changed"
    db_session.commit()
    crud.sync_default_services(db_session)
    db_session.refresh(first)
    assert first.description != "changed"


def test_appointment_conflicts_with_existing_appointment(db_session: Session) -> None:
    crud.sync_default_services(db_session)
    service = crud.list_active_services(db_session)[0]
    starts_at = datetime.now(timezone.utc) + timedelta(days=2)
    ends_at = starts_at + timedelta(minutes=service.duration_min)

    crud.create_appointment(
        db_session,
        service=service,
        client_name="Ana",
        client_phone="0712345678",
        client_email="ana@example.com",
        notes=None,
        starts_at=starts_at,
        ends_at=ends_at,
    )

    assert crud.has_booking_conflict(
        db_session,
        starts_at + timedelta(minutes=15),
        ends_at + timedelta(minutes=15),
    )


def test_appointment_conflicts_with_blocked_slot(db_session: Session) -> None:
    starts_at = datetime.now(timezone.utc) + timedelta(days=3)
    ends_at = starts_at + timedelta(hours=5)
    crud.create_blocked_slot(db_session, starts_at=starts_at, ends_at=ends_at, reason="Concediu")

    assert crud.has_booking_conflict(
        db_session,
        starts_at + timedelta(hours=1),
        starts_at + timedelta(hours=2),
    )
    assert len(crud.list_blocked_slots(db_session, starts_at, ends_at)) == 1
