from __future__ import annotations

import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import Cookie, Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import Settings, get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_ALGORITHM = "HS256"

_login_attempts: dict[str, list[float]] = {}


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def create_access_token(subject: str, settings: Settings) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_minutes)).timestamp()),
        "typ": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        settings.auth_cookie_name,
        token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.access_token_minutes * 60,
        path="/",
    )


def clear_auth_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(settings.auth_cookie_name, path="/")


def create_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_csrf_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        settings.csrf_cookie_name,
        token,
        httponly=False,
        secure=settings.cookie_secure,
        samesite="strict",
        max_age=60 * 60,
        path="/",
    )


def validate_csrf(request: Request, form_token: str, settings: Settings) -> None:
    cookie_token = request.cookies.get(settings.csrf_cookie_name)
    if not cookie_token or not form_token or not secrets.compare_digest(cookie_token, form_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token invalid")


def check_login_rate_limit(request: Request) -> None:
    client_host = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - 60
    attempts = [attempt for attempt in _login_attempts.get(client_host, []) if attempt > window_start]
    if len(attempts) >= 6:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts")
    attempts.append(now)
    _login_attempts[client_host] = attempts


def get_current_admin(
    token: Annotated[Optional[str], Cookie(alias="lustlashes_session")] = None,
    settings: Settings = Depends(get_settings),
) -> str:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc

    subject = payload.get("sub")
    if subject != settings.admin_username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    return subject


def get_admin_from_request(request: Request, settings: Settings) -> Optional[str]:
    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
    subject = payload.get("sub")
    return subject if subject == settings.admin_username else None
