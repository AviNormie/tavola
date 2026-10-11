# Tavola

QR menus and ordering for independent restaurants. A small portfolio demo: **Next.js** front end, **Laravel** JSON API, **SQLite**, English and Italian.

Two seeded restaurants (**Trattoria Sole**, Italian by default, and **North Pier Kitchen**, English by default) each have their own menu, tables and orders, so you can see tenant separation by switching slugs.

```
frontend/   Next.js (App Router, TypeScript, Tailwind CSS v4)
backend/    Laravel API (Eloquent, migrations, seeders, Sanctum tokens, PHPUnit tests)
```

## Run it locally

Requirements: PHP 8.3+ with `pdo_sqlite`, Composer, Node 20+.

```bash
# 1. API  → http://localhost:8000
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan serve

# 2. Front end  → http://localhost:3000   (second terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Demo URLs

| What | URL |
| --- | --- |
| Landing page | http://localhost:3000 |
| Trattoria Sole menu (try `?table=4`, as a table QR code would) | http://localhost:3000/r/trattoria-sole |
| Trattoria Sole kitchen dashboard | http://localhost:3000/dashboard/trattoria-sole |
| North Pier Kitchen menu | http://localhost:3000/r/north-pier-kitchen |
| North Pier Kitchen kitchen dashboard | http://localhost:3000/dashboard/north-pier-kitchen |

**Demo staff logins** (pre-filled on the dashboard sign-in form; the password is public, for demo only):

| Restaurant | Email | Password |
| --- | --- | --- |
| Trattoria Sole | `staff@trattoria-sole.test` | `demo1234` |
| North Pier Kitchen | `staff@north-pier.test` | `demo1234` |

Re-run `php artisan migrate:fresh --seed` any time to reset the demo data.

### Checks

```bash
cd backend  && php artisan test && vendor/bin/pint --test
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

## Architecture

- **Next.js** renders the landing page and loads restaurant and menu data on the server. The ordering basket and the kitchen dashboard are client components that talk to the API with `fetch` (`frontend/lib/api.ts`).
- **Laravel** exposes a small JSON API under `/api/restaurants/{slug}`. All business rules live in controllers and form requests: no service layer.
- **SQLite** holds restaurants, menu categories and items, tables, orders and order items. Prices are integer cents.
- **Language** is a URL prefix (`/en/...`, `/it/...`). A `NEXT_LOCALE` cookie remembers the last choice so unprefixed links such as `/r/trattoria-sole` (what a QR code would carry) open in that language, falling back to the restaurant's default. Interface text is in `frontend/lib/i18n.ts` (the Italian dictionary is typed against the English one, so a missing key fails the type check). Menu content is bilingual in the database. API validation messages follow the `Accept-Language` header (`backend/lang/`).
- The guest basket is kept in `sessionStorage`, so switching language or reloading doesn't empty it.

### API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/restaurants/{slug}` | none | Restaurant details, currency, table numbers |
| GET | `/api/restaurants/{slug}/menu` | none | Categories with items (both languages) |
| POST | `/api/restaurants/{slug}/orders` | none | Place an order: `{ table_number, items: [{ menu_item_id, quantity }] }` |
| POST | `/api/restaurants/{slug}/staff/login` | none | `{ email, password }` → bearer token |
| POST | `/api/restaurants/{slug}/staff/logout` | staff | Revoke the current token |
| GET | `/api/restaurants/{slug}/orders` | staff | 50 most recent orders |
| PATCH | `/api/restaurants/{slug}/orders/{order}/status` | staff | `{ status: new \| preparing \| ready }` |

The order total is always computed on the server from current menu prices; any client-sent total or price is ignored. Unavailable items, unknown items and quantities outside 1–20 are rejected with a 422 in the requested language.

## How tenant scoping works

1. Every route lives under `restaurants/{restaurant:slug}`. Laravel resolves the slug to a `Restaurant`; an unknown slug is a 404. The browser never supplies a restaurant ID.
2. `Route::scopeBindings()` makes `{order}` resolve through `$restaurant->orders()`, so an order ID from another restaurant is a 404 rather than a leak.
3. Controllers start every query from `$restaurant->…`, and validation rules for tables and menu items are constrained with `where('restaurant_id', …)`, so a guest can't order another restaurant's dish or table.
4. Staff accounts have one `restaurant_id`. The `staff` middleware (`EnsureStaffOfRestaurant`) returns 403 when a valid token is used on a different restaurant's slug, and login only succeeds for the user's own restaurant.

`backend/tests/Feature/TenantOrderApiTest.php` covers each of these cases.

**Not production-grade yet.** A real multi-tenant SaaS would also want: a global query scope or database-level isolation (e.g. Postgres row-level security) so a forgotten `$restaurant->` can't leak data; per-tenant roles and permissions; tenant-aware rate limiting, auditing and backups; hardened order numbering under concurrent writes (see the `ponytail:` note in `OrderController`); and a proper way to prove a guest owns an order before showing it back to them.

## Deployment

**Frontend (Vercel):** set the project root to `frontend/`.

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com` |

**API on Render (free, Docker):** `backend/Dockerfile` and `backend/docker-start.sh` run the API. The live demo API is at `https://tavola-api-0lvc.onrender.com`. It was created with:

```bash
render services create --name tavola-api --type web_service --runtime docker \
  --repo https://github.com/AviNormie/tavola --branch main --root-directory backend \
  --plan free --region frankfurt --health-check-path /up \
  --env-var APP_ENV=production --env-var APP_DEBUG=false --env-var LOG_CHANNEL=stderr \
  --env-var CACHE_STORE=array --env-var SESSION_DRIVER=array --env-var QUEUE_CONNECTION=sync \
  --env-var CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

The free plan sleeps after about 15 minutes idle (the first request then takes 30–60 seconds), and the SQLite file is rebuilt and reseeded on every boot, so orders don't survive a restart. After deploying the frontend, set `CORS_ALLOWED_ORIGINS` to its URL in the Render dashboard (Environment).

**API (any other PHP 8.3+ host):** point the web root at `backend/public`, run `composer install --no-dev --optimize-autoloader`, `php artisan migrate --force` and `php artisan config:cache`. Use a managed database (MySQL or Postgres) rather than SQLite on hosts with an ephemeral disk.

| Variable | Example |
| --- | --- |
| `APP_ENV` / `APP_DEBUG` | `production` / `false` |
| `APP_KEY` | from `php artisan key:generate --show` |
| `APP_URL` | `https://api.example.com` |
| `DB_*` | your database connection |
| `CORS_ALLOWED_ORIGINS` | `https://tavola.vercel.app` (comma-separate several) |

CORS is configured in `backend/config/cors.php` and only allows the origins in `CORS_ALLOWED_ORIGINS` (default `http://localhost:3000`). Do not run `migrate:fresh --seed` against production: the seeder creates public demo logins.

## Deliberate MVP limits

- No payments: the confirmation just shows the total to pay at the table.
- Staff login is demo-grade: bearer token in `localStorage`, one shared public password, no roles, no password reset. Don't reuse it as-is.
- No menu or table management UI; menus are seeded.
- The confirmation screen shows the status at the time of ordering; guests don't get live status updates. The kitchen dashboard polls every 10 seconds.
- No subscription billing, tenant onboarding, image uploads or analytics.
