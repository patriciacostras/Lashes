from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from fastapi import BackgroundTasks, Depends, FastAPI, Form, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import crud
from app.availability import get_end_date, is_inside_business_hours
from app.cache import TTLCache
from app.config import Settings, get_settings
from app.database import get_db
from app.emailer import BookingEmail, send_booking_emails
from app.models import AppointmentStatus
from app.schemas import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentStatusUpdate,
    BlockedSlotOut,
    BlockedSlotsResponse,
    ServiceOut,
    ServicesResponse,
)
from app.security import (
    check_login_rate_limit,
    clear_auth_cookie,
    create_access_token,
    create_csrf_token,
    get_admin_from_request,
    get_current_admin,
    set_auth_cookie,
    set_csrf_cookie,
    validate_csrf,
    verify_password,
)

BASE_DIR = Path(__file__).resolve().parent
LOCAL_TIMEZONE = ZoneInfo("Europe/Bucharest")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
services_cache: TTLCache[list[ServiceOut]] = TTLCache(ttl_seconds=60)

app = FastAPI(
    title="LustLashes Backend",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data:; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'none'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'"
    )
    if request.url.path.startswith("/admin"):
        response.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


settings = get_settings()
if settings.allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Content-Type", "X-CSRF-Token"],
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith("/admin") and exc.status_code == status.HTTP_401_UNAUTHORIZED:
        return RedirectResponse(url="/admin/login", status_code=status.HTTP_303_SEE_OTHER)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/health", include_in_schema=False)
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/services", response_model=ServicesResponse, response_model_by_alias=True)
def api_services(db: Session = Depends(get_db)) -> ServicesResponse:
    def load_services() -> list[ServiceOut]:
        crud.sync_default_services(db)
        return [ServiceOut.model_validate(service) for service in crud.list_active_services(db)]

    return ServicesResponse(services=services_cache.get(load_services))


@app.get("/api/blocked-slots", response_model=BlockedSlotsResponse, response_model_by_alias=True)
def api_blocked_slots(
    starts_at: datetime,
    ends_at: datetime,
    db: Session = Depends(get_db),
) -> BlockedSlotsResponse:
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)
    if ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)
    if ends_at <= starts_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interval invalid.")

    blocked_slots = crud.list_blocked_slots(db, starts_at, ends_at)
    return BlockedSlotsResponse(
        blocked_slots=[BlockedSlotOut.model_validate(blocked) for blocked in blocked_slots]
    )


@app.post(
    "/api/appointments",
    response_model=AppointmentOut,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def api_create_appointment(
    payload: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AppointmentOut:
    service = crud.get_service(db, payload.service_id)
    if not service or not service.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviciul ales nu este disponibil.")

    starts_at = payload.starts_at
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)
    ends_at = get_end_date(starts_at, service.duration_min)

    if starts_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Alege o data viitoare.")

    if not is_inside_business_hours(starts_at, ends_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alege un interval intre 18:00 si 00:00. Pentru alte ore, scrie-mi pe Instagram.",
        )

    if crud.has_booking_conflict(db, starts_at, ends_at):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Intervalul tocmai a fost ocupat. Alege alta ora.",
        )

    appointment = crud.create_appointment(
        db,
        service=service,
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        client_email=str(payload.client_email) if payload.client_email else None,
        notes=payload.notes,
        starts_at=starts_at,
        ends_at=ends_at,
    )
    background_tasks.add_task(
        send_booking_emails,
        settings,
        BookingEmail(
            client_name=appointment.client_name,
            client_phone=appointment.client_phone,
            client_email=appointment.client_email,
            service_name=service.name,
            starts_at=appointment.starts_at.astimezone(LOCAL_TIMEZONE).strftime("%d.%m.%Y %H:%M"),
            ends_at=appointment.ends_at.astimezone(LOCAL_TIMEZONE).strftime("%d.%m.%Y %H:%M"),
            notes=appointment.notes,
        ),
    )
    return AppointmentOut.model_validate(appointment)


@app.get("/admin/login", response_class=HTMLResponse)
def admin_login_page(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> HTMLResponse:
    if get_admin_from_request(request, settings):
        return RedirectResponse(url="/admin", status_code=status.HTTP_303_SEE_OTHER)
    csrf_token = create_csrf_token()
    page = templates.TemplateResponse(
        request,
        "login.html",
        {"csrf_token": csrf_token, "error": None},
    )
    set_csrf_cookie(page, csrf_token, settings)
    return page


REMEMBER_ME_DAYS = 7
DEFAULT_SESSION_MINUTES = 120


@app.post("/admin/login")
def admin_login(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    csrf_token: str = Form(...),
    remember_me: str = Form("off"),
    settings: Settings = Depends(get_settings),
):
    validate_csrf(request, csrf_token, settings)
    check_login_rate_limit(request)

    valid_user = username == settings.admin_username
    valid_password = verify_password(password, settings.admin_password_hash)
    if not (valid_user and valid_password):
        new_csrf = create_csrf_token()
        page = templates.TemplateResponse(
            request,
            "login.html",
            {"csrf_token": new_csrf, "error": "Date de login gresite."},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
        set_csrf_cookie(page, new_csrf, settings)
        return page

    stay_logged_in = remember_me.lower() in ("on", "1", "true", "yes")
    if stay_logged_in:
        token = create_access_token(settings.admin_username, settings, expires_minutes=REMEMBER_ME_DAYS * 24 * 60)
        max_age_seconds = REMEMBER_ME_DAYS * 24 * 60 * 60
    else:
        token = create_access_token(settings.admin_username, settings, expires_minutes=DEFAULT_SESSION_MINUTES)
        max_age_seconds = DEFAULT_SESSION_MINUTES * 60

    redirect = RedirectResponse(url="/admin", status_code=status.HTTP_303_SEE_OTHER)
    set_auth_cookie(redirect, token, settings, max_age_seconds=max_age_seconds)
    return redirect


@app.post("/admin/logout")
def admin_logout(settings: Settings = Depends(get_settings)):
    redirect = RedirectResponse(url="/admin/login", status_code=status.HTTP_303_SEE_OTHER)
    clear_auth_cookie(redirect, settings)
    return redirect


@app.get("/admin", response_class=HTMLResponse)
def admin_dashboard(
    request: Request,
    admin: str = Depends(get_current_admin),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    csrf_token = create_csrf_token()
    window_start = datetime.now(timezone.utc) - timedelta(days=1)
    window_end = window_start + timedelta(days=365)
    appointments = crud.list_appointments(db)
    blocked_slots = crud.list_blocked_slots(db, window_start, window_end)
    page = templates.TemplateResponse(
        request,
        "admin.html",
        {
            "appointments": appointments,
            "statuses": list(AppointmentStatus),
            "admin": admin,
            "blocked_slots": blocked_slots,
            "csrf_token": csrf_token,
        },
    )
    set_csrf_cookie(page, csrf_token, settings)
    return page


@app.post("/admin/blocked-slots")
def admin_create_blocked_slot(
    request: Request,
    starts_at: date = Form(...),
    ends_at: date = Form(...),
    reason: str = Form("Concediu"),
    csrf_token: str = Form(...),
    admin: str = Depends(get_current_admin),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    validate_csrf(request, csrf_token, settings)
    if ends_at < starts_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Data de final este inainte de start.")

    local_start = datetime.combine(starts_at, time.min, tzinfo=LOCAL_TIMEZONE)
    local_end = datetime.combine(ends_at + timedelta(days=1), time.min, tzinfo=LOCAL_TIMEZONE)
    crud.create_blocked_slot(
        db,
        starts_at=local_start.astimezone(timezone.utc),
        ends_at=local_end.astimezone(timezone.utc),
        reason=reason.strip()[:240] or "Concediu",
    )
    return RedirectResponse(url="/admin", status_code=status.HTTP_303_SEE_OTHER)


@app.patch(
    "/api/admin/appointments/{appointment_id}",
    response_model=AppointmentOut,
    response_model_by_alias=True,
)
def admin_update_appointment(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AppointmentOut:
    appointment = crud.update_appointment_status(db, appointment_id, payload.status)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programarea nu exista.")
    return AppointmentOut.model_validate(appointment)
