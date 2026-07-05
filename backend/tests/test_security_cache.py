from __future__ import annotations

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.cache import TTLCache
from app.config import Settings
from app.security import (
    clear_auth_cookie,
    create_access_token,
    create_csrf_token,
    get_admin_from_request,
    hash_password,
    set_auth_cookie,
    set_csrf_cookie,
    validate_csrf,
    verify_password,
)


def make_settings() -> Settings:
    return Settings(
        DATABASE_URL="sqlite+pysqlite:///:memory:",
        JWT_SECRET_KEY="test-secret-key-with-more-than-32-characters",
        ADMIN_USERNAME="patri",
        ADMIN_PASSWORD_HASH=hash_password("secret123"),
        ADMIN_EMAIL="lustlashes70@gmail.com",
        ALLOWED_ORIGINS="http://testserver",
    )


def make_request(cookie_header: str = "") -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"cookie", cookie_header.encode())] if cookie_header else [],
        "client": ("127.0.0.1", 1234),
    }
    return Request(scope)


def test_ttl_cache_loads_once_until_clear() -> None:
    calls = 0
    cache: TTLCache[int] = TTLCache(ttl_seconds=60)

    def loader() -> int:
        nonlocal calls
        calls += 1
        return calls

    assert cache.get(loader) == 1
    assert cache.get(loader) == 1
    cache.clear()
    assert cache.get(loader) == 2


def test_password_hash_and_verify() -> None:
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)


def test_csrf_validation_accepts_matching_cookie() -> None:
    settings = make_settings()
    token = create_csrf_token()
    request = make_request(f"{settings.csrf_cookie_name}={token}")
    validate_csrf(request, token, settings)


def test_csrf_validation_rejects_missing_cookie() -> None:
    with pytest.raises(HTTPException):
        validate_csrf(make_request(), "token", make_settings())


def test_auth_cookie_helpers_roundtrip() -> None:
    settings = make_settings()
    token = create_access_token("patri", settings)
    request = make_request(f"{settings.auth_cookie_name}={token}")

    assert get_admin_from_request(request, settings) == "patri"

    from starlette.responses import Response

    response = Response()
    set_auth_cookie(response, token, settings)
    set_csrf_cookie(response, "csrf", settings)
    clear_auth_cookie(response, settings)
    assert "set-cookie" in response.headers
