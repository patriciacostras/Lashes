---
description: Deploy LustLashes pe Mac si productie
---

# Deploy LustLashes

## 1. Pregateste mediul pe MacBook

// turbo
```bash
cd /Users/patricia/Desktop/Gene/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Genereaza JWT secret pentru .env

```bash
openssl rand -base64 32
```

Copiaza rezultatul in `backend/.env` la `JWT_SECRET_KEY`.

## 3. Genereaza hash-ul parolei admin

```bash
cd /Users/patricia/Desktop/Gene/backend
source .venv/bin/activate
python -m scripts.hash_password
```

Tasteaza parola dorita de 2 ori. Copiaza hash-ul in `backend/.env` la `ADMIN_PASSWORD_HASH`.

## 4. Configureaza backend .env

```bash
cd /Users/patricia/Desktop/Gene/backend
# editeaza .env
```

Valori esentiale:
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_EMAIL`
- `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `COOKIE_SECURE=true` (doar in productie cu HTTPS)
- `ALLOWED_ORIGINS` (domeniul frontend-ului)

## 5. Porneste local

// turbo
```bash
cd /Users/patricia/Desktop/Gene/backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

In alt terminal:

// turbo
```bash
cd /Users/patricia/Desktop/Gene
npm install
npm run dev
```

## 6. Build si deploy

// turbo
```bash
cd /Users/patricia/Desktop/Gene
npm run build
```

Backend:

// turbo
```bash
cd /Users/patricia/Desktop/Gene/backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 7. Deploy productie recomandat

- Frontend: Vercel (conectat la repo).
- Backend: Render, Fly, Railway sau VPS.
- PostgreSQL: managed (Neon, Supabase, AWS RDS, etc).
- Configureaza `NEXT_PUBLIC_API_BASE_URL` si `NEXT_PUBLIC_BACKEND_ADMIN_URL` in Vercel.
- Seteaza `ALLOWED_ORIGINS` in backend pe domeniul Vercel.
- Activeaza HTTPS si seteaza `COOKIE_SECURE=true`.
