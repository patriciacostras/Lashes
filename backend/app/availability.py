from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

TIMEZONE = ZoneInfo("Europe/Bucharest")
WEEKDAY_NIGHT_START = 18
WEEKDAY_NIGHT_END = 4
SAMPLE_STEP_MINUTES = 30


def get_end_date(starts_at: datetime, duration_min: int) -> datetime:
    return starts_at + timedelta(minutes=duration_min)


def is_open_at(moment: datetime) -> bool:
    local = moment.astimezone(TIMEZONE)
    is_weekend = local.weekday() in (5, 6)
    if is_weekend:
        return True
    return local.hour >= WEEKDAY_NIGHT_START or local.hour < WEEKDAY_NIGHT_END


def is_inside_business_hours(starts_at: datetime, ends_at: datetime) -> bool:
    if ends_at <= starts_at:
        return False

    current = starts_at
    step = timedelta(minutes=SAMPLE_STEP_MINUTES)
    while current < ends_at:
        if not is_open_at(current):
            return False
        current += step

    return is_open_at(ends_at - timedelta(seconds=60))
