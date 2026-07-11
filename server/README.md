# Multivendor E-Commerce — Backend (server/)

Node.js + Express 4 + MongoDB (Mongoose 8) REST API for the React frontend in `../my-project`.
Implements every endpoint the frontend calls. The frontend needs **zero code changes** —
only its `.env` is switched to live mode.

## Quick start

```bash
cd server
cp .env.example .env          # then edit MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY…
npm install
npm run seed                  # optional: demo users + products
npm run dev                   # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok", "time": "…" }`

## Switch the frontend to the live backend

Edit `../my-project/.env`:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_…
```

Then `cd ../my-project && npm install && npm run dev`.

## Demo accounts (after `npm run seed`)

| Role     | Email               | Password    |
|----------|---------------------|-------------|
| Admin    | admin@store.pk      | admin123    |
| Seller   | seller@store.pk     | seller123   |
| Customer | customer@store.pk   | customer123 |

## Scripts

| Command         | Purpose                          |
|-----------------|----------------------------------|
| `npm run dev`   | Start with nodemon (auto-reload) |
| `npm start`     | Start once (production)          |
| `npm run seed`  | Seed categories, users, products |
| `npm test`      | Jest + Supertest                 |

## REST API (base `/api`)

- `auth`   — register, login, profile, change-password, forgot-password, reset-password (OTP based)
- `admin`  — stats, users, sellers approve/reject, orders, transactions log, refund requests, withdrawal requests, settings, sales report
- `products` — list/search, get, create, update, delete (supports up to 5 images)
- `shops`  — list, my shop, get, shop products
- `orders` — create, my orders, seller orders, status, cancel order, refund request, invoice PDF download
- `categories` — list, create, update, delete
- `wishlist` — get, sync/update (persistent database sync)
- `notifications` — list notifications, mark read, mark all read
- `upload` — `/upload/image` (single upload), `/upload/images` (bulk upload up to 5 files)
- `seller` — stats, revenue-chart, available balance, withdrawals request
- `payment` — JazzCash/Easypaisa/Stripe success/failure callback handlers, webhook

## Environment Variables

- `REDIS_URL` — Configures the Socket.io Redis adapter for live scale-out notifications.
- `JWT_SECRET` — Key for auth session token signature verification.
- `STRIPE_SECRET_KEY` — API key for processing checkout intents.

## Notes

- Every model exposes `id` (mapped from `_id`) so frontend `.id` usage works unchanged.
- Orders are returned in the frontend's flattened shape: `{ id, status, amount, date, paymentMethod, address, items, orderNumber }`.
- Uploaded files are served from `/uploads/*`; for production use Cloudinary/S3 (Render disks are ephemeral).
