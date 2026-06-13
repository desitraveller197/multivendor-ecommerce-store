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

- `auth`   — register, login, profile, change-password, forgot/reset password
- `admin`  — stats, users, sellers approve/reject, orders
- `products` — list/search, get, create, update, delete
- `shops`  — list, my shop, get, shop products
- `orders` — create (+ Stripe PaymentIntent), my orders, seller orders, status
- `categories` — list, create, delete
- `upload/image` — multipart image upload
- `seller/stats/revenue-chart` — recharts data
- `payment/webhook` — Stripe webhook (raw body)

## Stripe webhook (local)

```bash
stripe listen --forward-to localhost:5000/api/payment/webhook
# copy whsec_… into server/.env as STRIPE_WEBHOOK_SECRET
```

## Notes

- Every model exposes `id` (mapped from `_id`) so frontend `.id` usage works unchanged.
- Orders are returned in the frontend's flattened shape: `{ id, status, amount, date, paymentMethod, address, items }`.
- Uploaded files are served from `/uploads/*`; for production use Cloudinary/S3 (Render disks are ephemeral).
