from __future__ import annotations

import time
from collections.abc import Callable
from typing import Generic, Optional, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._expires_at = 0.0
        self._value: Optional[T] = None

    def get(self, loader: Callable[[], T]) -> T:
        now = time.time()
        if self._value is None or now >= self._expires_at:
            self._value = loader()
            self._expires_at = now + self.ttl_seconds
        return self._value

    def clear(self) -> None:
        self._value = None
        self._expires_at = 0.0
