from __future__ import annotations

import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from app.config import Settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class BookingEmail:
    client_name: str
    client_phone: str
    client_email: str | None
    service_name: str
    starts_at: str
    ends_at: str
    notes: str | None


def send_booking_emails(settings: Settings, booking: BookingEmail) -> None:
    if not settings.smtp_host:
        logger.info("SMTP_HOST is not configured; skipping booking emails.")
        return

    recipients = [settings.admin_email]
    if booking.client_email:
        recipients.append(booking.client_email)

    for recipient in recipients:
        message = build_booking_email(settings, booking, recipient)
        send_email(settings, message)


def build_booking_email(settings: Settings, booking: BookingEmail, recipient: str) -> EmailMessage:
    is_admin = recipient == settings.admin_email
    subject = (
        f"Programare noua LustLashes - {booking.client_name}"
        if is_admin
        else "Confirmare cerere programare LustLashes"
    )
    intro = (
        "Ai primit o cerere noua de programare."
        if is_admin
        else "Am primit cererea ta de programare. Revin cu confirmarea finala cat mai repede."
    )

    body = "\n".join(
        [
            intro,
            "",
            f"Serviciu: {booking.service_name}",
            f"Interval: {booking.starts_at} - {booking.ends_at}",
            f"Nume: {booking.client_name}",
            f"Telefon: {booking.client_phone}",
            f"Email: {booking.client_email or '-'}",
            f"Detalii: {booking.notes or '-'}",
            "",
            "Instagram: @lustlashestimisoara",
            "LustLashes Timisoara",
        ]
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email or settings.admin_email
    message["To"] = recipient
    message.set_content(body)
    return message


def send_email(settings: Settings, message: EmailMessage) -> None:
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username and settings.smtp_password:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except Exception:
        logger.exception("Could not send booking email to %s", message["To"])
