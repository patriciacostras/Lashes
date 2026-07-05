from __future__ import annotations

from datetime import datetime, timezone

from app.availability import get_end_date, is_inside_business_hours, is_open_at


def test_weekend_is_open_all_day() -> None:
    saturday_noon = datetime(2026, 7, 11, 12, 0, tzinfo=timezone.utc)
    assert is_open_at(saturday_noon)


def test_weekday_daytime_is_closed() -> None:
    monday_noon = datetime(2026, 7, 6, 9, 0, tzinfo=timezone.utc)
    assert not is_open_at(monday_noon)


def test_weekday_night_slot_is_valid() -> None:
    starts_at = datetime(2026, 7, 6, 19, 0, tzinfo=timezone.utc)
    ends_at = get_end_date(starts_at, 120)
    assert is_inside_business_hours(starts_at, ends_at)


def test_slot_crossing_closed_hours_is_rejected() -> None:
    starts_at = datetime(2026, 7, 6, 1, 0, tzinfo=timezone.utc)
    ends_at = get_end_date(starts_at, 360)
    assert not is_inside_business_hours(starts_at, ends_at)
