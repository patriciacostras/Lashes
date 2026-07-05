from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud
from app.config import get_settings
from app.models import AppointmentStatus
from app.security import create_access_token

LOCAL_TIMEZONE = ZoneInfo("Europe/Bucharest")


def future_weekday_night() -> datetime:
    candidate = datetime.now(LOCAL_TIMEZONE) + timedelta(days=7)
    while candidate.weekday() >= 5:
        candidate += timedelta(days=1)
    return candidate.replace(hour=19, minute=0, second=0, microsecond=0)


def test_services_endpoint_seeds_database(client: TestClient) -> None:
    response = client.get("/api/services")

    assert response.status_code == 200
    body = response.json()
    assert len(body["services"]) == 13
    assert "durationMin" in body["services"][0]


def test_create_appointment_sends_created_response(client: TestClient) -> None:
    service = client.get("/api/services").json()["services"][0]
    starts_at = future_weekday_night()

    response = client.post(
        "/api/appointments",
        json={
            "clientName": "Ana Maria",
            "clientPhone": "0712345678",
            "clientEmail": "ana@example.com",
            "notes": "natural",
            "serviceId": service["id"],
            "startsAt": starts_at.isoformat(),
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["clientName"] == "Ana Maria"
    assert body["service"]["id"] == service["id"]


def test_create_appointment_rejects_blocked_vacation(
    client: TestClient, db_session: Session
) -> None:
    service = client.get("/api/services").json()["services"][0]
    starts_at = future_weekday_night()
    crud.create_blocked_slot(
        db_session,
        starts_at=starts_at.astimezone(ZoneInfo("UTC")),
        ends_at=(starts_at + timedelta(hours=4)).astimezone(ZoneInfo("UTC")),
        reason="Concediu",
    )

    response = client.post(
        "/api/appointments",
        json={
            "clientName": "Ana Maria",
            "clientPhone": "0712345678",
            "clientEmail": "ana@example.com",
            "notes": "",
            "serviceId": service["id"],
            "startsAt": starts_at.isoformat(),
        },
    )

    assert response.status_code == 409


def test_create_appointment_rejects_unknown_service(client: TestClient) -> None:
    response = client.post(
        "/api/appointments",
        json={
            "clientName": "Ana Maria",
            "clientPhone": "0712345678",
            "clientEmail": "ana@example.com",
            "notes": "",
            "serviceId": "missing",
            "startsAt": future_weekday_night().isoformat(),
        },
    )

    assert response.status_code == 404


def test_create_appointment_rejects_closed_hours(client: TestClient) -> None:
    service = client.get("/api/services").json()["services"][0]
    starts_at = future_weekday_night().replace(hour=9)

    response = client.post(
        "/api/appointments",
        json={
            "clientName": "Ana Maria",
            "clientPhone": "0712345678",
            "clientEmail": "ana@example.com",
            "notes": "",
            "serviceId": service["id"],
            "startsAt": starts_at.isoformat(),
        },
    )

    assert response.status_code == 400


def test_blocked_slots_endpoint_returns_vacation(client: TestClient, db_session: Session) -> None:
    starts_at = future_weekday_night()
    crud.create_blocked_slot(
        db_session,
        starts_at=starts_at.astimezone(ZoneInfo("UTC")),
        ends_at=(starts_at + timedelta(days=1)).astimezone(ZoneInfo("UTC")),
        reason="Concediu",
    )

    response = client.get(
        "/api/blocked-slots",
        params={
            "starts_at": (starts_at - timedelta(days=1)).isoformat(),
            "ends_at": (starts_at + timedelta(days=2)).isoformat(),
        },
    )

    assert response.status_code == 200
    assert response.json()["blockedSlots"][0]["reason"] == "Concediu"


def test_blocked_slots_endpoint_rejects_invalid_range(client: TestClient) -> None:
    starts_at = future_weekday_night()
    response = client.get(
        "/api/blocked-slots",
        params={"starts_at": starts_at.isoformat(), "ends_at": starts_at.isoformat()},
    )

    assert response.status_code == 400


def test_admin_requires_login(client: TestClient) -> None:
    response = client.get("/admin", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/admin/login"


def test_admin_login_sets_session_cookie(client: TestClient) -> None:
    login_page = client.get("/admin/login")
    csrf_token = login_page.cookies["lustlashes_csrf"]

    response = client.post(
        "/admin/login",
        data={
            "username": "patri",
            "password": "secret123",
            "csrf_token": csrf_token,
        },
        follow_redirects=False,
    )

    assert response.status_code == 303
    assert response.headers["location"] == "/admin"
    assert "lustlashes_session" in response.cookies


def test_admin_can_create_blocked_slot(client: TestClient) -> None:
    token = create_access_token("patri", get_settings())
    client.cookies.set("lustlashes_session", token)
    dashboard = client.get("/admin")
    csrf_token = dashboard.cookies["lustlashes_csrf"]

    response = client.post(
        "/admin/blocked-slots",
        data={
            "starts_at": "2026-07-20",
            "ends_at": "2026-07-22",
            "reason": "Concediu",
            "csrf_token": csrf_token,
        },
        follow_redirects=False,
    )

    assert response.status_code == 303


def test_admin_blocked_slot_rejects_invalid_dates(client: TestClient) -> None:
    token = create_access_token("patri", get_settings())
    client.cookies.set("lustlashes_session", token)
    dashboard = client.get("/admin")
    csrf_token = dashboard.cookies["lustlashes_csrf"]

    response = client.post(
        "/admin/blocked-slots",
        data={
            "starts_at": "2026-07-22",
            "ends_at": "2026-07-20",
            "reason": "Concediu",
            "csrf_token": csrf_token,
        },
    )

    assert response.status_code == 400


def test_admin_can_update_appointment_status(client: TestClient, db_session: Session) -> None:
    service = client.get("/api/services").json()["services"][0]
    model_service = crud.get_service(db_session, service["id"])
    assert model_service is not None
    starts_at = future_weekday_night()
    appointment = crud.create_appointment(
        db_session,
        service=model_service,
        client_name="Ana Maria",
        client_phone="0712345678",
        client_email=None,
        notes=None,
        starts_at=starts_at,
        ends_at=starts_at + timedelta(minutes=model_service.duration_min),
    )
    token = create_access_token("patri", get_settings())
    client.cookies.set("lustlashes_session", token)

    response = client.patch(
        f"/api/admin/appointments/{appointment.id}",
        json={"status": AppointmentStatus.CONFIRMED.value},
    )

    assert response.status_code == 200
    assert response.json()["status"] == AppointmentStatus.CONFIRMED.value


def test_admin_update_returns_404_for_missing_appointment(client: TestClient) -> None:
    token = create_access_token("patri", get_settings())
    client.cookies.set("lustlashes_session", token)

    response = client.patch(
        "/api/admin/appointments/missing",
        json={"status": AppointmentStatus.CONFIRMED.value},
    )

    assert response.status_code == 404
