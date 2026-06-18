# CarryMate

A campus delivery-matching app for NIT Durgapur students: post a trip, post a request,
and matches are calculated dynamically — never stored, never stale.

## Architecture

- **No `matches` table.** Matches are a query result computed live from `trips` and
  `requests` every time they're viewed.
- Only **accepted/rejected delivery relationships** are persisted, in `delivery_requests`.
- A user row is only created after both email OTP and SMS OTP succeed.

## Database tables

`users`, `trips`, `requests`, `delivery_requests` — see `backend/src/db/schema.sql`.
Run that file in the Supabase SQL editor, and create a **private** storage bucket named
`itemImages`.

## Local development

```bash
# Backend
cd backend
cp .env.example .env   # fill in Supabase/Twilio/SMTP/Google credentials
npm install
npm run dev             # http://localhost:5000

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend container: port 5173
- Backend container: port 5000
- Nginx: port 80, proxies `/api` and `/health` to the backend, everything else to the frontend
- All containers share the `carrymate-net` Docker network; the backend is reachable
  internally at `http://backend:5000`.

## Deployment (AWS EC2)

Internet → Nginx → Frontend container / Backend container → Supabase.

Open only ports 22, 80, 443 on the EC2 security group. Do not expose 5000 or 5173.

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. Never commit `.env` files.
The Supabase service role key must only ever be used by the backend.
