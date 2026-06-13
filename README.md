# Multivendor E-Commerce Store — Full Stack (MERN)

This package contains the complete application:

```
multivendor ecommerce store/
├─ my-project/   # React + Vite frontend (UNCHANGED except .env → live mode)
└─ server/       # Node.js + Express + MongoDB backend (NEW)
```

The backend implements every REST endpoint the frontend calls, exactly matching
the response shapes the Redux slices and pages expect. No frontend source code was
changed — only `my-project/.env` was switched to live mode (`VITE_USE_MOCK=false`).

## Prerequisites

- Node.js 18+ and npm
- A MongoDB database (local `mongod`, or a free MongoDB Atlas cluster)

## 1) Start the backend

```bash
cd server
cp .env.example .env        # then set MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY…
npm install
npm run seed                # optional: demo accounts + products
npm run dev                 # http://localhost:5000
```

Verify: open http://localhost:5000/api/health → `{ "status": "ok", ... }`

Demo accounts after `npm run seed`:

| Role     | Email             | Password    |
|----------|-------------------|-------------|
| Admin    | admin@store.pk    | admin123    |
| Seller   | seller@store.pk   | seller123   |
| Customer | customer@store.pk | customer123 |

## 2) Start the frontend

```bash
cd my-project
npm install
npm run dev                 # http://localhost:5173
```

`my-project/.env` is already set to:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
```

So the app talks to the live backend immediately. (Set `VITE_USE_MOCK=true`
to return to the offline mock-data mode.)

## Stripe (optional, for live checkout)

1. Put your `sk_test_…` in `server/.env` as `STRIPE_SECRET_KEY`.
2. Put your `pk_test_…` in `my-project/.env` (already wired).
3. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:5000/api/payment/webhook
   ```
   Copy the `whsec_…` into `server/.env` as `STRIPE_WEBHOOK_SECRET`.

Without Stripe keys, use **Cash on Delivery** at checkout — fully functional.

## Notes

- The existing `my-project/server/stripe-server.mjs` (port 4242) is left untouched.
  The live checkout uses the main backend's `POST /api/orders` instead.
- `node_modules` are not included — run `npm install` in each folder.
- See `server/README.md` for the full API reference.
