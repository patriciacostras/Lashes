from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-with-more-than-32-characters")
os.environ.setdefault("ADMIN_USERNAME", "patri")
os.environ.setdefault(
    "ADMIN_PASSWORD_HASH",
    "$2b$12$7i4i2dCInNzfpiujGf.2C.0QUhTceUvff4ihxHvz9RB6GQg3B9wlG",
)
os.environ.setdefault("ALLOWED_ORIGINS", "http://testserver")
os.environ.setdefault("ADMIN_EMAIL", "lustlashes70@gmail.com")

from app.database import Base  # noqa: E402
from app.main import app, get_db, services_cache  # noqa: E402


@pytest.fixture()
def db_session() -> Iterator[Session]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        yield db_session

    services_cache.clear()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    services_cache.clear()
