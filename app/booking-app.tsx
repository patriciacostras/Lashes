"use client";

import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Instagram,
  Moon,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { defaultServices, type BookingService } from "@/lib/services";

type Service = BookingService;

type BookingPayload = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  serviceId: string;
  startsAt: string;
};

type BlockedSlot = {
  id: string;
  reason: string | null;
  startsAt: string;
  endsAt: string;
};

type CalendarDay = {
  date: Date;
  isoDate: string;
  dayNumber: number;
  inMonth: boolean;
  isBlocked: boolean;
  isDisabled: boolean;
  isSelected: boolean;
};

const slotFormatter = new Intl.DateTimeFormat("ro-RO", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest"
});

const monthFormatter = new Intl.DateTimeFormat("ro-RO", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Bucharest"
});

const INSTAGRAM_HANDLE = "lustlashestimisoara";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
const BOOKING_WINDOW_MONTHS = 1;
const weekdayLabels = ["L", "M", "M", "J", "V", "S", "D"];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function apiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

export function BookingApp() {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [selectedServiceId, setSelectedServiceId] = useState(defaultServices[0].id);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const bookingWindow = useMemo(() => getBookingWindow(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDateIso, setSelectedDateIso] = useState(() => formatDateKey(new Date()));
  const [hasBrandLogo, setHasBrandLogo] = useState(true);
  const [hasHeroImage, setHasHeroImage] = useState(true);
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    notes: ""
  });
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({
    type: "idle",
    text: "Alege serviciul si intervalul, apoi trimite cererea de programare."
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/services"))
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.services) && data.services.length > 0) {
          setServices(data.services);
          setSelectedServiceId(data.services[0].id);
        }
      })
      .catch(() => {
        setStatus({
          type: "idle",
          text: "Alege serviciul si intervalul, apoi trimite cererea de programare."
        });
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({
      starts_at: bookingWindow.today.toISOString(),
      ends_at: endOfDay(bookingWindow.maxDate).toISOString()
    });

    fetch(apiUrl(`/api/blocked-slots?${params.toString()}`))
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.blockedSlots)) {
          setBlockedSlots(data.blockedSlots);
        }
      })
      .catch(() => {
        setBlockedSlots([]);
      });
  }, [bookingWindow]);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ?? services[0];

  const selectedDate = useMemo(() => parseDateKey(selectedDateIso), [selectedDateIso]);
  const calendarDays = useMemo(
    () =>
      buildCalendarDays({
        visibleMonth,
        today: bookingWindow.today,
        maxDate: bookingWindow.maxDate,
        blockedSlots,
        selectedDateIso
      }),
    [visibleMonth, bookingWindow, blockedSlots, selectedDateIso]
  );
  const slots = useMemo(
    () => buildSlotsForDate(selectedDate, selectedService?.durationMin ?? 120, blockedSlots),
    [selectedDate, selectedService, blockedSlots]
  );
  const currentMonth = startOfMonth(visibleMonth);
  const canGoPrev = currentMonth > startOfMonth(bookingWindow.today);
  const canGoNext = addMonths(currentMonth, 1) <= startOfMonth(bookingWindow.maxDate);

  useEffect(() => {
    setSelectedSlot(slots[0]?.iso ?? "");
  }, [slots]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot || !selectedService) {
      setStatus({ type: "error", text: "Alege un serviciu si o ora disponibila." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", text: "Trimit programarea..." });

    const payload: BookingPayload = {
      ...form,
      serviceId: selectedService.id,
      startsAt: selectedSlot
    };

    let response: Response;
    let data: { message?: string };

    try {
      response = await fetch(apiUrl("/api/appointments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      data = await response.json();
    } catch {
      setStatus({
        type: "error",
        text: `Nu am putut trimite programarea acum. Scrie-mi pe Instagram la @${INSTAGRAM_HANDLE}.`
      });
      setIsSubmitting(false);
      return;
    }

    if (!response.ok) {
      setStatus({
        type: "error",
        text: data.message ?? "Nu am putut salva programarea."
      });
      setIsSubmitting(false);
      return;
    }

    setStatus({
      type: "ok",
      text: "Programarea a fost trimisa. O poti confirma din admin."
    });
    setForm({ clientName: "", clientPhone: "", clientEmail: "", notes: "" });
    setIsSubmitting(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          {hasBrandLogo ? (
            <img
              alt="LustLashes logo"
              className="brand-logo-small"
              onError={() => setHasBrandLogo(false)}
              src="/lustlashes-hero.png"
            />
          ) : (
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-bow" />
              <span className="cat-face">:3</span>
            </span>
          )}
          <span className="brand-name brand-name-text">LustLashes</span>
        </a>
        <nav className="nav" aria-label="Navigatie principala">
          <a href="#servicii">Servicii</a>
          <a href="#booking">Booking</a>
          <a href="/admin">Admin</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} /> Programari de noapte pentru gene
          </span>
          <h1>Da, eu sunt Patri Gene</h1>
          <p>
            Program flexibil dupa 18:00 pana la 04:00 in timpul saptamanii,
            iar sambata si duminica toata ziua. Stam si toata noaptea daca
            e nevoie si nu mai gasesti loc nicaieri.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#booking">
              <CalendarCheck size={18} /> Programeaza-te
            </a>
            <a className="ghost-button" href={INSTAGRAM_URL}>
              <Instagram size={18} /> @{INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>
        <aside className="hero-panel" aria-label="Preview studio">
          <div className="hero-image-card">
            {hasHeroImage ? (
              <img
                alt="LustLashes goth pink lash artwork"
                className="kitty-hero-image"
                onError={() => setHasHeroImage(false)}
                src="/lustlashes-hero.png"
              />
            ) : (
              <div className="mascot" aria-hidden="true">
                <span className="mascot-bow" />
                <span className="mascot-face">^.^</span>
              </div>
            )}
          </div>
          <div className="mini-stats">
            <span className="mini-stat">
              <strong>13</strong>
              <span>servicii</span>
            </span>
            <span className="mini-stat">
              <strong>18-04</strong>
              <span>program</span>
            </span>
            <span className="mini-stat">
              <strong>DM</strong>
              <span>@{INSTAGRAM_HANDLE}</span>
            </span>
          </div>
        </aside>
      </section>

      <section className="section" id="servicii">
        <div className="section-title">
          <h2>Servicii</h2>
          <p>Timpii sunt ganditi mai lejer pentru un lash tech la inceput, ca fiecare set sa iasa curat.</p>
        </div>
        <div className="service-sections">
          {groupServices(services).map((group) => (
            <section className="service-group" key={group.title}>
              <h3>
                <WandSparkles size={18} /> {group.title}
              </h3>
              <div className="service-grid">
                {group.items.map((service) => (
                  <article className="service-card" key={service.id}>
                    <h4>{service.name}</h4>
                    <p>{service.description}</p>
                    <div className="service-meta">
                      <span className="pill">
                        <Clock size={14} /> {service.durationMin} min
                      </span>
                      <span className="pill">{service.priceRon} RON</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="section" id="booking">
        <div className="section-title">
          <h2>Booking</h2>
          <p>
            Daca vrei intre 09:00 si 18:00, scrie-mi pe Instagram la{" "}
            <a className="inline-link" href={INSTAGRAM_URL}>
              @{INSTAGRAM_HANDLE}
            </a>
            .
          </p>
        </div>
        <div className="booking-layout">
          <form className="booking-form" onSubmit={submitBooking}>
            <div className="field-grid">
              <label className="field full">
                Serviciu
                <select
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.priceRon} RON
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Nume
                <input
                  required
                  minLength={2}
                  value={form.clientName}
                  onChange={(event) => setForm({ ...form, clientName: event.target.value })}
                  placeholder="Numele tau"
                />
              </label>
              <label className="field">
                Telefon
                <input
                  required
                  value={form.clientPhone}
                  onChange={(event) => setForm({ ...form, clientPhone: event.target.value })}
                  placeholder="07..."
                />
              </label>
              <label className="field full">
                Email optional
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(event) => setForm({ ...form, clientEmail: event.target.value })}
                  placeholder="clienta@email.ro"
                />
              </label>
              <label className="field full">
                Detalii
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Preferinte, alergii, stil dorit..."
                />
              </label>
            </div>
            <div className="form-footer">
              <p className={`status ${status.type === "idle" ? "" : status.type}`}>
                {status.text}
              </p>
              <button className="primary-button" disabled={isSubmitting} type="submit">
                <CalendarCheck size={18} /> {isSubmitting ? "Se trimite" : "Trimite"}
              </button>
            </div>
          </form>

          <div className="calendar-panel">
            <div className="section-title">
              <h2>Calendar</h2>
              <p>
                <Moon size={16} /> Alege o zi in urmatoarea luna.
              </p>
            </div>
            <div className="month-toolbar" aria-label="Schimba luna">
              <button
                aria-label="Luna anterioara"
                className="icon-button"
                disabled={!canGoPrev}
                onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                type="button"
              >
                <ChevronLeft size={18} />
              </button>
              <strong>{monthFormatter.format(visibleMonth)}</strong>
              <button
                aria-label="Luna urmatoare"
                className="icon-button"
                disabled={!canGoNext}
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                type="button"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="month-grid" aria-label="Calendar programari">
              {weekdayLabels.map((label, index) => (
                <span className="weekday" key={`${label}-${index}`}>
                  {label}
                </span>
              ))}
              {calendarDays.map((day) => (
                <button
                  aria-label={`${day.isoDate}${day.isBlocked ? ", concediu" : ""}`}
                  className={[
                    "calendar-day",
                    day.inMonth ? "" : "outside",
                    day.isSelected ? "active" : "",
                    day.isBlocked ? "blocked" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={day.isDisabled}
                  key={day.isoDate}
                  onClick={() => setSelectedDateIso(day.isoDate)}
                  type="button"
                >
                  <span>{day.dayNumber}</span>
                  {day.isBlocked ? <small>concediu</small> : null}
                </button>
              ))}
            </div>
            <div className="slot-heading">
              <strong>Ore disponibile</strong>
              <span>Luni-vineri 18:00-04:00, weekend non-stop.</span>
            </div>
            <div className="slot-grid">
              {slots.length > 0 ? (
                slots.map((slot) => (
                  <button
                    className={`slot-button ${slot.iso === selectedSlot ? "active" : ""}`}
                    key={slot.iso}
                    onClick={() => setSelectedSlot(slot.iso)}
                    type="button"
                  >
                    {slot.label}
                  </button>
                ))
              ) : (
                <p className="empty-slots">Nu sunt ore disponibile in ziua asta.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="reguli">
        <div className="section-title">
          <h2>Reguli gene</h2>
          <p>Ca setul sa arate curat si sa tina cat mai frumos, vino pregatita si ingrijeste-l bland dupa aplicare.</p>
        </div>
        <div className="care-grid">
          <article className="care-card">
            <h3>Inainte de aplicare</h3>
            <ul>
              <li>Vino cu genele curate, fara mascara, eyeliner sau lipici de gene false.</li>
              <li>Evita cremele si produsele uleioase in zona ochilor in ziua programarii.</li>
              <li>Nu iti ondula genele inainte de aplicare si anunta-ma daca ai alergii sau ochi sensibili.</li>
              <li>Planifica-ti timp lejer, mai ales pentru seturile 4D, 5D si 6D+.</li>
            </ul>
          </article>
          <article className="care-card">
            <h3>Dupa aplicare</h3>
            <ul>
              <li>Nu freca ochii si nu trage de extensii; usuca-le prin tamponare usoara.</li>
              <li>Curata genele cu o spuma speciala si perie-le bland cand sunt uscate.</li>
              <li>Evita produsele pe baza de ulei in jurul ochilor, pentru ca pot slabi adezivul.</li>
              <li>Programeaza intretinerea la 2-3 saptamani ca setul sa ramana uniform.</li>
            </ul>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <strong>LustLashes</strong>
          <span>programari flexibile pentru gene 1D-6D+, intretinere si demontare</span>
        </div>
        <a href={INSTAGRAM_URL}>
          <Instagram size={18} /> @{INSTAGRAM_HANDLE}
        </a>
      </footer>
    </main>
  );
}

function groupServices(services: Service[]) {
  return [
    {
      title: "Aplicare gene",
      items: services.filter((service) => service.name.startsWith("Extensii"))
    },
    {
      title: "Intretinere",
      items: services.filter((service) => service.name.startsWith("Intretinere"))
    },
    {
      title: "Demontare",
      items: services.filter((service) => service.name.startsWith("Demontare"))
    }
  ].filter((group) => group.items.length > 0);
}

function buildSlotsForDate(date: Date, durationMin: number, blockedSlots: BlockedSlot[]) {
  const slots: { iso: string; label: string }[] = [];
  const now = new Date();

  if (isDateBlocked(date, blockedSlots)) {
    return slots;
  }

  for (let hour = 0; hour < 24; hour += 1) {
    const slot = new Date(date);
    slot.setHours(hour, 0, 0, 0);
    const endsAt = new Date(slot.getTime() + durationMin * 60 * 1000);

    if (
      slot <= now ||
      isRangeBlocked(slot, endsAt, blockedSlots) ||
      !isSlotAllowed(slot, endsAt)
    ) {
      continue;
    }

    slots.push({
      iso: slot.toISOString(),
      label: slotFormatter.format(slot)
    });
  }

  return slots;
}

function buildCalendarDays({
  visibleMonth,
  today,
  maxDate,
  blockedSlots,
  selectedDateIso
}: {
  visibleMonth: Date;
  today: Date;
  maxDate: Date;
  blockedSlots: BlockedSlot[];
  selectedDateIso: string;
}) {
  const monthStart = startOfMonth(visibleMonth);
  const gridStart = new Date(monthStart);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  gridStart.setDate(monthStart.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const isoDate = formatDateKey(date);
    const isBlocked = isDateBlocked(date, blockedSlots);
    const inMonth = date.getMonth() === monthStart.getMonth();
    const isPast = endOfDay(date) < today;
    const isBeyondWindow = startOfDay(date) > maxDate;

    return {
      date,
      isoDate,
      dayNumber: date.getDate(),
      inMonth,
      isBlocked,
      isDisabled: !inMonth || isPast || isBeyondWindow || isBlocked,
      isSelected: selectedDateIso === isoDate
    };
  });
}

function getBookingWindow() {
  const today = startOfDay(new Date());
  return {
    today,
    maxDate: addMonths(today, BOOKING_WINDOW_MONTHS)
  };
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function startOfMonth(date: Date) {
  const copy = startOfDay(date);
  copy.setDate(1);
  return copy;
}

function addMonths(date: Date, count: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + count);
  return copy;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isDateBlocked(date: Date, blockedSlots: BlockedSlot[]) {
  return isRangeBlocked(startOfDay(date), endOfDay(date), blockedSlots);
}

function isRangeBlocked(startsAt: Date, endsAt: Date, blockedSlots: BlockedSlot[]) {
  return blockedSlots.some((blockedSlot) => {
    const blockedStart = new Date(blockedSlot.startsAt);
    const blockedEnd = new Date(blockedSlot.endsAt);
    return blockedStart < endsAt && blockedEnd > startsAt;
  });
}

function isSlotAllowed(startsAt: Date, endsAt: Date) {
  const sampleStepMs = 30 * 60 * 1000;

  for (
    let timestamp = startsAt.getTime();
    timestamp < endsAt.getTime();
    timestamp += sampleStepMs
  ) {
    if (!isOpenAtLocal(new Date(timestamp))) {
      return false;
    }
  }

  return isOpenAtLocal(new Date(endsAt.getTime() - 60 * 1000));
}

function isOpenAtLocal(date: Date) {
  const day = date.getDay();
  const hour = date.getHours() + date.getMinutes() / 60;
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return true;
  }

  return hour >= 18 || hour < 4;
}
