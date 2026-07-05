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
import Link from "next/link";
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
  isPast: boolean;
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
const retentionExamples = [
  {
    src: "/retention-100.png",
    alt: "Set complet cu gene dense si uniforme",
    label: "Set complet: gene dense, uniforme",
    kind: "full"
  },
  {
    src: "/retention-60.png",
    alt: "Intretinere potrivita cu 40-60% gene pastrate",
    label: "Optim pentru intretinere: 40-60% gene pastrate",
    kind: "refill"
  },
  {
    src: "/retention-40.png",
    alt: "Set nou recomandat cu mai putin de 40% gene ramase",
    label: "Set nou: mai putin de 40%, aspect neregulat",
    kind: "new-set"
  }
];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const adminBaseUrl = process.env.NEXT_PUBLIC_BACKEND_ADMIN_URL ?? "http://localhost:8000/admin";

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
  const [cookiesAccepted, setCookiesAccepted] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCookiesAccepted(localStorage.getItem("lustlashes_cookies_ok") === "1");
  }, []);

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
      text: "Programarea a fost trimisa. Daca ai trecut emailul, primesti confirmarea si acolo."
    });
    setForm({ clientName: "", clientPhone: "", clientEmail: "", notes: "" });
    setIsSubmitting(false);
  }

  return (
    <main className="shell">
      <header className="topbar animate-fade-in">
        <a className="brand hover-glow" href="#">
          <img
            alt="LustLashes logo"
            className="brand-logo-small"
            src="/brand-logo.png"
          />
          <span className="brand-name brand-name-text">LustLashes</span>
        </a>
        <nav className="nav" aria-label="Navigatie principala">
          <a className="clickable" href="#servicii">Servicii</a>
          <a className="clickable" href="#booking">Booking</a>
          <a className="clickable" href={adminBaseUrl}>Admin</a>
        </nav>
      </header>

      <section className="hero animate-fade-in">
        <div className="hero-copy">
          <span className="eyebrow animate-fade-in-delay-1">
            <Sparkles size={16} /> Programari de noapte pentru gene
          </span>
          <h1 className="animate-fade-in-delay-2">Da, chiar eu sunt Patri Gene</h1>
          <p className="animate-fade-in-delay-3">
            Program flexibil dupa 18:00 pana la 04:00 in timpul saptamanii,
            iar sambata si duminica toata ziua. Stam si toata noaptea daca
            e nevoie si nu mai gasesti loc nicaieri. Genele colorate sunt
            welcomed oricand — spune-mi ce nuanta vrei.
          </p>
          <div className="hero-actions">
            <a className="primary-button clickable" href="#booking">
              <CalendarCheck size={18} /> Programeaza-te
            </a>
            <a className="ghost-button clickable" href={INSTAGRAM_URL}>
              <Instagram size={18} /> @{INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>
        <aside className="hero-panel animate-fade-in-delay-1 hover-lift" aria-label="Preview studio">
          <div className="hero-image-card">
            {hasHeroImage ? (
              <img
                alt="LustLashes goth pink lash artwork"
                className="kitty-hero-image"
                onError={() => setHasHeroImage(false)}
                src="/lustlashes-logo-small.png"
              />
            ) : (
              <div className="mascot" aria-hidden="true">
                <span className="mascot-bow" />
                <span className="mascot-face">^.^</span>
              </div>
            )}
          </div>
          <div className="mini-stats">
            <span className="mini-stat hover-glow">
              <strong>13</strong>
              <span>servicii</span>
            </span>
            <span className="mini-stat hover-glow">
              <strong>18-04</strong>
              <span>program</span>
            </span>
            <span className="mini-stat hover-glow">
              <strong>DM</strong>
              <span>@{INSTAGRAM_HANDLE}</span>
            </span>
          </div>
        </aside>
      </section>

      <section className="section animate-fade-in" id="servicii">
        <div className="section-title">
          <h2>Servicii</h2>
          <p>Alege setul sau intretinerea potrivita pentru stilul tau.</p>
        </div>
        <div className="service-sections">
          {groupServices(services).map((group, groupIndex) => (
            <section className={`service-group animate-fade-in-delay-${Math.min(groupIndex + 1, 3)}`} key={group.title}>
              <h3>
                <WandSparkles size={18} /> {group.title}
              </h3>
              {group.title === "Aplicare & intretinere" && (
                <div className="price-guide">
                  <span className="price-guide-title">Preturi orientative</span>
                  <div className="price-guide-row">
                    <span className="price-guide-label">Aplicare noua:</span>
                    <span className="price-guide-value">130 - 200 RON (6D+ la DM)</span>
                  </div>
                  <div className="price-guide-row">
                    <span className="price-guide-label">Intretinere / refill:</span>
                    <span className="price-guide-value">120 - 190 RON (6D+ la DM)</span>
                  </div>
                  <span className="price-guide-note">Toate duratele sunt estimative: 120 min.</span>
                </div>
              )}
              <div className="service-grid">
                {group.items.map((service) => (
                  <article className="service-card" key={service.id}>
                    <h4>{service.name}</h4>
                    <p>{service.description}</p>
                    <div className="service-meta">
                      <span className="pill">
                        <Clock size={14} /> {service.durationMin} min
                      </span>
                      <span className="pill">{formatServicePrice(service)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="section animate-fade-in" id="booking">
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
          <form className="booking-form hover-lift" onSubmit={submitBooking}>
            <div className="field-grid">
              <label className="field full">
                Serviciu
                <select
                  className="pulse-focus"
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {formatServicePrice(service)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Nume
                <input
                  className="pulse-focus"
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
                  className="pulse-focus"
                  required
                  value={form.clientPhone}
                  onChange={(event) => setForm({ ...form, clientPhone: event.target.value })}
                  placeholder="07..."
                />
              </label>
              <label className="field full">
                Email pentru confirmare
                <input
                  className="pulse-focus"
                  type="email"
                  value={form.clientEmail}
                  onChange={(event) => setForm({ ...form, clientEmail: event.target.value })}
                  placeholder="clienta@email.ro"
                />
              </label>
              <label className="field full">
                Detalii
                <textarea
                  className="pulse-focus"
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
              <button className="primary-button clickable" disabled={isSubmitting} type="submit">
                <CalendarCheck size={18} /> {isSubmitting ? "Se trimite" : "Trimite"}
              </button>
            </div>
          </form>

          <div className="calendar-panel hover-lift">
            <div className="section-title">
              <h2>Calendar</h2>
              <p>
                <Moon size={16} /> Alege o zi in urmatoarea luna.
              </p>
            </div>
            <div className="month-toolbar" aria-label="Schimba luna">
              <button
                aria-label="Luna anterioara"
                className="icon-button clickable"
                disabled={!canGoPrev}
                onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                type="button"
              >
                <ChevronLeft size={18} />
              </button>
              <strong>{monthFormatter.format(visibleMonth)}</strong>
              <button
                aria-label="Luna urmatoare"
                className="icon-button clickable"
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
                    "clickable",
                    "pulse-focus",
                    day.inMonth ? "" : "outside",
                    day.isSelected ? "active" : "",
                    day.isBlocked ? "blocked" : "",
                    day.isPast ? "past" : ""
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
              <span>Sloturile apar din 2 in 2 ore. Luni-vineri 18:00-04:00, weekend non-stop.</span>
            </div>
            <div className="slot-grid">
              {slots.length > 0 ? (
                slots.map((slot) => (
                  <button
                    className={`slot-button clickable pulse-focus ${slot.iso === selectedSlot ? "active" : ""}`}
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

      <section className="section animate-fade-in" id="reguli">
        <div className="section-title">
          <h2>Rules to be followed</h2>
          <p>Ca setul sa arate curat si sa tina cat mai frumos, vino pregatita si ingrijeste-l bland dupa aplicare.</p>
        </div>
        <div className="care-grid">
          <article className="care-card">
            <h3>Before application</h3>
            <ul className="care-list">
              <li>Vino cu genele curate, fara mascara, eyeliner sau lipici de gene false.</li>
              <li>Evita cremele si produsele uleioase in zona ochilor in ziua programarii.</li>
              <li>Nu iti ondula genele inainte de aplicare si anunta-ma daca ai alergii sau ochi sensibili.</li>
              <li>Anunta inainte de programare daca doresti si demontarea extensiilor vechi.</li>
              <li>Planifica-ti timp lejer, mai ales pentru seturile 4D, 5D si 6D+.</li>
            </ul>
          </article>
          <article className="care-card">
            <h3>After application</h3>
            <ul className="care-list">
              <li>Intretinerea este recomandata la 3-4 saptamani, cand ai 40-60% gene pastrate si aspectul general este ingrijit.</li>
              <li>Daca au ramas mai putin de 40% gene sau au trecut peste 4 saptamani, este recomandat set nou.</li>
              <li>Nu freca ochii, nu trage de extensii si evita produsele pe baza de ulei in jurul ochilor.</li>
            </ul>
          </article>
          <article className="care-card retention-card" aria-label="Criterii refill sau set nou">
            <h3>Refill or new set?</h3>
            <div className="retention-visual">
              {retentionExamples.map((example) => (
                <figure className={`retention-example ${example.kind}`} key={example.src}>
                  <img
                    alt={example.alt}
                    src={example.src}
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                      event.currentTarget.nextElementSibling?.removeAttribute("hidden");
                    }}
                  />
                  <span className={`retention-row ${example.kind}`} hidden />
                  <figcaption>{example.label}</figcaption>
                </figure>
              ))}
            </div>
          </article>
        </div>
      </section>

      {mounted && !cookiesAccepted && (
        <div className="cookie-banner animate-fade-in" role="region" aria-label="Cookies">
          <p>
            Acest site foloseste cookies necesare pentru functionare si securitate.
            <a className="cookie-banner-link" href="/politica-cookies">
              Afla mai multe
            </a>
          </p>
          <button
            className="cookie-banner-button"
            onClick={() => {
              localStorage.setItem("lustlashes_cookies_ok", "1");
              setCookiesAccepted(true);
            }}
            type="button"
          >
            Am inteles
          </button>
        </div>
      )}
      <footer className="site-footer animate-fade-in">
        <div>
          <strong>LustLashes</strong>
          <span>programari flexibile pentru gene 1D-6D+, intretinere si demontare</span>
          <nav className="footer-legal" aria-label="Informatii legale">
            <Link className="footer-link" href="/politica-cookies">
              Politica cookies
            </Link>
            <Link className="footer-link" href="/termeni-si-conditii">
              Termeni si conditii
            </Link>
          </nav>
        </div>
        <a className="clickable" href={INSTAGRAM_URL}>
          <Instagram size={18} /> @{INSTAGRAM_HANDLE}
        </a>
      </footer>
    </main>
  );
}

function groupServices(services: Service[]) {
  const application = services.filter((service) => service.name.startsWith("Extensii"));
  const maintenance = services.filter((service) => service.name.startsWith("Intretinere"));
  const removal = services.filter((service) => service.name.startsWith("Demontare"));
  const groups: { title: string; items: Service[] }[] = [];

  if (application.length > 0 || maintenance.length > 0) {
    groups.push({
      title: "Aplicare & intretinere",
      items: [...application, ...maintenance]
    });
  }

  if (removal.length > 0) {
    groups.push({ title: "Demontare", items: removal });
  }

  return groups;
}

function buildSlotsForDate(date: Date, durationMin: number, blockedSlots: BlockedSlot[]) {
  const slots: { iso: string; label: string }[] = [];
  const now = new Date();

  if (isDateBlocked(date, blockedSlots)) {
    return slots;
  }

  for (let hour = 0; hour < 24; hour += 2) {
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

function formatServicePrice(service: Service) {
  return service.priceRon > 0 ? `${service.priceRon} RON` : "pret la DM";
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
      isPast,
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
