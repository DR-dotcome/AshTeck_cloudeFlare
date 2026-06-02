# AshTech Cloudflare Pages + D1 Website

Premium full-stack website for AshTech IT services: network installation, IT infrastructure, CCTV/IP cameras, router and switch configuration, Wi-Fi optimization, maintenance, backups, and basic cybersecurity.

## Stack

- Frontend: static HTML, CSS, JavaScript in `public/`
- Backend/API: Cloudflare Pages Functions in `functions/`
- Database: Cloudflare D1 SQLite
- Auth: signed JWT using `JWT_SECRET`
- Password hashing: Web Crypto compatible PBKDF2-SHA256
- Deployment: Cloudflare Pages free plan

No Express, Prisma, Supabase, PostgreSQL, Render, Koyeb, or Oracle is required.

## Required Environment Variables

Use Cloudflare Pages environment variables for production and `.dev.vars` for local Wrangler development. You can copy `.dev.vars.example`:

```env
JWT_SECRET=
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=
ADMIN_NAME=
ADMIN_PASSWORD=
```

`JWT_SECRET` must be at least 32 characters. `ADMIN_PASSWORD` is only used by the seed generator and is never exposed to the frontend.

## Cloudflare Setup

Install dependencies:

```bash
npm install
```

Install Wrangler:

```bash
npm install -D wrangler
```

Create D1 database:

```bash
npx wrangler d1 create ashtech-db
```

Copy the returned database id into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ashtech-db"
database_id = "replace-with-your-d1-database-id"
```

Create D1 tables:

```bash
npx wrangler d1 execute ashtech-db --file=./schema.sql
```

Create the first admin:

```bash
npm run seed:admin
npx wrangler d1 execute ashtech-db --file=./seed-admin.sql
```

Deploy to Cloudflare Pages:

```bash
npx wrangler pages deploy public
```

## Local Development

Create `.dev.vars`:

```env
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=AshTech Admin
ADMIN_PASSWORD=change-this-secure-password
```

Initialize local D1 and seed:

```bash
npx wrangler d1 execute ashtech-db --local --file=./schema.sql
npm run seed:admin
npx wrangler d1 execute ashtech-db --local --file=./seed-admin.sql
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:8788
```

Admin dashboard:

```text
http://localhost:8788/admin.html
```

Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## API Routes

- `GET /api/health`
- `POST /api/contact`
- `POST /api/quote`
- `POST /api/admin/login`
- `GET /api/messages`
- `DELETE /api/messages/:id`
- `GET /api/quotes`
- `DELETE /api/quotes/:id`

Extra dashboard routes:

- `GET /api/admin/session`
- `GET /api/admin/stats`
- `GET /api/admin/activity`
- `GET /api/messages/export`
- `GET /api/quotes/export`

Protected admin routes require:

```text
Authorization: Bearer <jwt>
```

## Database Tables

D1 tables from `schema.sql`:

- `admins`
- `contact_messages`
- `quote_requests`
- `activity_logs`

## Security

- Admin routes are protected with JWT.
- `JWT_SECRET` is never sent to the frontend.
- Admin passwords are never stored as plain text.
- Password hashes use PBKDF2-SHA256 with a per-admin salt.
- Contact, quote, and login routes use best-effort isolate-local rate limiting.
- Inputs are normalized, validated, length-limited, and rejected when HTML/script-like content is detected.
- Admin logins, CSV exports, and delete actions are stored in `activity_logs`.
- API responses hide server stack traces.
- `.env`, `.dev.vars`, and generated `seed-admin.sql` are ignored by Git.

## Backups

Before production changes, export D1 data from Cloudflare:

```bash
npx wrangler d1 export ashtech-db --output=backup.sql
```

You can also export data from the Cloudflare dashboard under D1. Keep backups and environment variables in a secure password manager, not in Git.

## SEO Files

The project includes:

- `public/sitemap.xml`
- `public/robots.txt`
- Open Graph and Twitter card meta tags
- Custom `404.html` and `error.html`

Replace `https://your-cloudflare-pages-domain.pages.dev` in HTML meta tags, `sitemap.xml`, and `robots.txt` with your real Cloudflare Pages URL or custom domain.
