from __future__ import annotations

from app.config import Settings
from app.emailer import BookingEmail, build_booking_email, send_booking_emails


def make_settings(**overrides: object) -> Settings:
    values = {
        "DATABASE_URL": "sqlite+pysqlite:///:memory:",
        "JWT_SECRET_KEY": "test-secret-key-with-more-than-32-characters",
        "ADMIN_USERNAME": "patri",
        "ADMIN_PASSWORD_HASH": "$2b$12$7i4i2dCInNzfpiujGf.2C.0QUhTceUvff4ihxHvz9RB6GQg3B9wlG",
        "ADMIN_EMAIL": "lustlashes70@gmail.com",
        "ALLOWED_ORIGINS": "http://testserver",
        **overrides,
    }
    return Settings(**values)


def make_booking() -> BookingEmail:
    return BookingEmail(
        client_name="Ana",
        client_phone="0712345678",
        client_email="ana@example.com",
        service_name="Extensii gene 2D",
        starts_at="10.07.2026 19:00",
        ends_at="10.07.2026 22:30",
        notes="natural",
    )


def test_build_admin_booking_email() -> None:
    settings = make_settings()
    message = build_booking_email(settings, make_booking(), "lustlashes70@gmail.com")

    assert message["To"] == "lustlashes70@gmail.com"
    assert "Programare noua" in message["Subject"]
    assert "Extensii gene 2D" in message.get_content()
    assert "@lustlashestimisoara" in message.get_content()


def test_send_booking_emails_is_noop_without_smtp() -> None:
    send_booking_emails(make_settings(SMTP_HOST=""), make_booking())


def test_send_booking_emails_uses_smtp(monkeypatch) -> None:
    sent_to: list[str] = []

    class FakeSMTP:
        def __init__(self, host: str, port: int, timeout: int) -> None:
            assert host == "smtp.example.com"
            assert port == 587
            assert timeout == 10

        def __enter__(self):
            return self

        def __exit__(self, *args) -> None:
            return None

        def starttls(self) -> None:
            return None

        def login(self, username: str, password: str) -> None:
            assert username == "user"
            assert password == "pass"

        def send_message(self, message) -> None:
            sent_to.append(message["To"])

    monkeypatch.setattr("app.emailer.smtplib.SMTP", FakeSMTP)
    settings = make_settings(
        SMTP_HOST="smtp.example.com",
        SMTP_USERNAME="user",
        SMTP_PASSWORD="pass",
        SMTP_FROM_EMAIL="hello@example.com",
    )

    send_booking_emails(settings, make_booking())

    assert sent_to == ["lustlashes70@gmail.com", "ana@example.com"]
