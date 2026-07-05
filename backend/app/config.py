from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Optional, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = Field(alias="DATABASE_URL")
    jwt_secret_key: str = Field(alias="JWT_SECRET_KEY", min_length=32)
    admin_username: str = Field(alias="ADMIN_USERNAME", min_length=3)
    admin_password_hash: str = Field(alias="ADMIN_PASSWORD_HASH", min_length=20)
    environment: str = Field(default="development", alias="ENVIRONMENT")
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=list, alias="ALLOWED_ORIGINS"
    )
    admin_email: str = Field(default="lustlashes70@gmail.com", alias="ADMIN_EMAIL")
    smtp_host: Optional[str] = Field(default=None, alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_username: Optional[str] = Field(default=None, alias="SMTP_USERNAME")
    smtp_password: Optional[str] = Field(default=None, alias="SMTP_PASSWORD")
    smtp_from_email: Optional[str] = Field(default=None, alias="SMTP_FROM_EMAIL")
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")
    access_token_minutes: int = 60 * 8
    csrf_cookie_name: str = "lustlashes_csrf"
    auth_cookie_name: str = "lustlashes_session"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, value: Union[str, list[str]]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
