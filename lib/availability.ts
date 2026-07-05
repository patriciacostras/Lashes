export const openingHours = {
  weekdayNightStartHour: 18,
  weekdayNightEndHour: 4,
  slotStepMin: 30,
  timeZone: "Europe/Bucharest"
};

export function getEndDate(startsAt: Date, durationMin: number) {
  return new Date(startsAt.getTime() + durationMin * 60 * 1000);
}

export function hasOverlap(
  startsAt: Date,
  endsAt: Date,
  item: { startsAt: Date; endsAt: Date }
) {
  return startsAt < item.endsAt && endsAt > item.startsAt;
}

export function isInsideBusinessHours(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) {
    return false;
  }

  const sampleStepMs = openingHours.slotStepMin * 60 * 1000;

  for (
    let timestamp = startsAt.getTime();
    timestamp < endsAt.getTime();
    timestamp += sampleStepMs
  ) {
    if (!isOpenAt(new Date(timestamp))) {
      return false;
    }
  }

  return isOpenAt(new Date(endsAt.getTime() - 60 * 1000));
}

export function isOpenAt(date: Date) {
  const local = getZonedParts(date);
  const hour = local.hour + local.minute / 60;
  const isWeekend = local.weekday === "Sat" || local.weekday === "Sun";

  if (isWeekend) {
    return true;
  }

  return hour >= openingHours.weekdayNightStartHour || hour < openingHours.weekdayNightEndHour;
}

function getZonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: openingHours.timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: value("weekday"),
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    hour: Number(value("hour")),
    minute: Number(value("minute"))
  };
}
