# Walk-in Service Booking Platform

Production monorepo backend for a B2C marketplace — real-time bookings, vendor matching, Stripe payments, geolocation search.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js 20+, Express, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 |
| Payments | Stripe (authorization → capture) |
| Monorepo | pnpm workspaces + Turborepo |

## Repository Structure

```
booking-platform/
├── apps/
│   └── api/                          # Express TypeScript API
│       └── src/
│           ├── routes/              # REST endpoints (customers, vendors, bookings, payments, admin)
│           ├── middleware/           # JWT auth, Zod validation, error handling
│           ├── services/             # Business logic (booking, matching, payment, auth)
│           ├── repositories/          # Drizzle ORM query builders (no raw SQL)
│           └── db/                   # Schema + migrations
├── packages/
│   └── shared/                       # Zod schemas + TypeScript types
├── pnpm-workspace.yaml
└── turbo.json
```

## Core Features

**Booking Workflow**
- `POST /v1/bookings` — create booking with Stripe authorization hold
- `PATCH /v1/bookings/:id/status` — transitions: pending → matched → paid → completed
- No double-booking: atomic status transitions

**Vendor Matching**
- Geolocation search: `ST_DWithin` proximity over GIN-indexed GEOGRAPHY column
- Haversine distance sorting
- Availability windows (weekly schedule per vendor)

**Stripe Payment Flows**
- Authorization hold at booking (`capture_method: 'manual'`)
- Capture on service completion
- Void/cancel on customer cancellation
- Idempotent webhook handler (`payment_intent.succeeded`, `canceled`, `refunded`)

**Authentication**
- Three JWT factories: `CustomerAuth`, `VendorAuth`, `AdminAuth`
- Role middleware on all protected routes
- bcrypt password hashing

## API Design

All endpoints validated with Zod v4 schemas. Repository pattern — zero raw SQL in route handlers.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /v1/customers/register | — | Register |
| POST | /v1/customers/login | — | JWT login |
| POST | /v1/vendors/register | — | Register |
| POST | /v1/vendors/login | — | JWT login |
| GET | /v1/vendors/nearby | — | Geo search |
| POST | /v1/bookings | Customer | Create (auth hold) |
| GET | /v1/bookings | Customer/Vendor | List |
| PATCH | /v1/bookings/:id/status | Vendor | Transition |
| POST | /v1/payments/intent | Customer | Stripe intent |
| POST | /v1/payments/capture/:id | System | Capture on completion |
| POST | /v1/webhooks/stripe | — | Stripe events |

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate migrations (after schema changes)
pnpm --filter @repo/db drizzle-kit generate
pnpm --filter @repo/db drizzle-kit migrate

# Run dev server
pnpm --filter @repo/api dev

# Run tests
pnpm test
```

## Environment Variables

```bash
# apps/api/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/booking
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Data Model

- **customers** — email, name, phone, password_hash
- **vendors** — email, name, category, rating
- **locations** — vendor_id, lat/lng, geography (GIN indexed), city, radius_km
- **services** — vendor_id, name, duration_minutes, price_cents
- **bookings** — customer_id, vendor_id, service_id, status, stripe_payment_intent_id, authorized_cents, captured_cents
- **vendor_availability** — vendor_id, day_of_week, start_time, end_time