# LustLashes

Aplicatie de booking pentru gene, cu frontend Next.js si backend securizat FastAPI + PostgreSQL.

## Ce contine

- Frontend public pentru cliente
- Backend Python separat in `backend/`
- FastAPI + SQLAlchemy + Alembic
- PostgreSQL
- JWT in cookie `HttpOnly`
- CSRF pentru formulare admin
- Admin protejat la backend `/admin`
- CORS explicit, security headers, rate limit simplu la login
- Cache TTL pentru lista de servicii
- Email de confirmare pentru clienta si admin, prin SMTP
- CI cu teste backend si coverage minim 90%

## Frontend

Instaleaza dependentele:

```bash
npm install
```

Creeaza `.env` dupa `.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
NEXT_PUBLIC_BACKEND_ADMIN_URL="http://localhost:8000/admin"
```

Porneste frontend-ul:

```bash
npm run dev
```

Deschide:

```txt
http://localhost:3000
```

## Backend

Pornire rapida cu Docker:

```bash
cp backend/.env.example backend/.env
docker compose up -d postgres
```

Genereaza o parola hash-uita pentru admin:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.hash_password
```

Pune hash-ul rezultat in `backend/.env` la `ADMIN_PASSWORD_HASH`.

Genereaza si un secret lung pentru `JWT_SECRET_KEY`, apoi configureaza emailul:

```bash
ADMIN_EMAIL="lustlashes70@gmail.com"
SMTP_HOST="smtp.provider.ro"
SMTP_PORT="587"
SMTP_USERNAME="user"
SMTP_PASSWORD="parola-sau-app-password"
SMTP_FROM_EMAIL="lustlashes70@gmail.com"
SMTP_USE_TLS="true"
```

Ruleaza migrarea si backend-ul:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Admin securizat:

```txt
http://localhost:8000/admin
```

API:

```txt
GET  http://localhost:8000/api/services
POST http://localhost:8000/api/appointments
```

## Teste Si CI

Ruleaza testele backend cu coverage:

```bash
cd backend
pip install -r requirements-dev.txt
pytest --cov=app --cov-report=term-missing --cov-fail-under=90
```

Verifica frontend-ul:

```bash
npx tsc --noEmit
npm run build
```

Pipeline-ul GitHub Actions este in `.github/workflows/ci.yml`.

## Note De Securitate

- Nu pune parola admin in cod.
- In productie seteaza `COOKIE_SECURE=true`.
- Foloseste HTTPS cand ai domeniu.
- Pastreaza `JWT_SECRET_KEY` lung si privat.
- Ruleaza `alembic upgrade head` la deploy.
- Seteaza `ALLOWED_ORIGINS` strict pe domeniul frontend-ului tau.
- Foloseste un provider SMTP cu app password sau token dedicat, nu parola contului personal.
- Nu rula `npm run build` in timp ce `npm run dev` este pornit; poate corupe `.next` local.

Pentru productie simpla: frontend pe Vercel, backend pe Render/Fly/Railway/VPS, PostgreSQL managed, domeniu cu HTTPS. Kubernetes nu este necesar pentru acest proiect acum; Docker Compose sau servicii managed sunt suficiente si mai usor de intretinut.
