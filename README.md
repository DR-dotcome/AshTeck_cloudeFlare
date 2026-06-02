# AshTech Full-Stack Website

Premium full-stack website for AshTech IT services: networks, infrastructure, CCTV/IP cameras, router and switch configuration, Wi-Fi optimization, maintenance, backups, and basic cybersecurity.

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express
- Database: Supabase PostgreSQL
- ORM: Prisma
- Auth: bcrypt admin password hash plus JWT admin sessions
- Deployment: Render Free web service
- Storage: PostgreSQL only, no JSON database

This setup is suitable for a small real project with light traffic, around 5 simultaneous users, and no paid services.

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and fill every required value:

```env
PORT=3000
DATABASE_URL=
DIRECT_URL=
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET=
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=
ADMIN_NAME=
ADMIN_PASSWORD=
```

`DATABASE_URL` must be the Supabase transaction pooler URL on port `6543`. `DIRECT_URL` must be the Supabase session pooler URL on port `5432` for Prisma migrations. `JWT_SECRET` must be at least 32 characters.

For local development, `npm run seed` creates the first admin from `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD`. The password is hashed with bcrypt before it is stored in PostgreSQL. To generate a bcrypt hash manually, run:

```bash
npm run hash-password Adminf123
```

Run Prisma migrations and seed the admin:

```bash
npx prisma migrate dev
npm run seed
```

Start locally:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Supabase Free Setup

1. Create Supabase project.
2. Go to Connect > ORMs > Prisma.
3. Copy the transaction pooler URL on port `6543` to `DATABASE_URL`.
4. Copy the session pooler URL on port `5432` to `DIRECT_URL`.
5. Replace `[YOUR-PASSWORD]` with your real Supabase database password.
6. Run `npx prisma migrate dev`.
7. Run `npm run seed`.
8. Run `npm start`.

Do not paste `DATABASE_URL=` inside the value. The final `.env` line must look like `DATABASE_URL=postgresql://...`, not `DATABASE_URL=DATABASE_URL="postgresql://..."`.

Prisma tables created:

- `contact_messages`
- `quote_requests`
- `admins`
- `activity_logs`

## Render Free Deployment

This repo includes `render.yaml`. You can deploy with Render Blueprint or create a Web Service manually.

Manual settings:

- Runtime: Node
- Plan: Free
- Build Command:

```bash
npm install --include=dev && npm run db:deploy && npm run db:generate
```

- Start Command:

```bash
npm run seed && npm start
```

Render environment variables:

```env
DATABASE_URL=your-supabase-pooled-postgres-url
DIRECT_URL=your-supabase-session-pooler-postgres-url
CORS_ORIGINS=https://your-render-service.onrender.com
JWT_SECRET=your-long-random-secret-at-least-32-characters
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=admin@yourdomain.example
ADMIN_NAME=AshTech Admin
ADMIN_PASSWORD=your-first-admin-password
```

Render Free services sleep when inactive. The first request after sleep can be slow, which is normal for the free plan.

## Admin

Open:

```text
http://localhost:3000/admin.html
```

Log in with:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

The seed script creates the first admin only when that admin email does not already exist. It stores a bcrypt hash in the `admins` table; it does not store plain text passwords. Admin API routes require `Authorization: Bearer <jwt>`.

## API Routes

- `POST /api/contact`
- `POST /api/quote`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `GET /api/admin/stats`
- `GET /api/admin/activity`
- `GET /api/messages`
- `GET /api/messages?search=&preferredLanguage=&page=1&limit=6`
- `GET /api/messages/export`
- `GET /api/quotes`
- `GET /api/quotes?search=&service=&businessType=&page=1&limit=6`
- `GET /api/quotes/export`
- `DELETE /api/messages/:id`
- `DELETE /api/quotes/:id`

Protected routes:

- `GET /api/admin/session`
- `GET /api/admin/stats`
- `GET /api/admin/activity`
- `GET /api/messages`
- `GET /api/messages/export`
- `GET /api/quotes`
- `GET /api/quotes/export`
- `DELETE /api/messages/:id`
- `DELETE /api/quotes/:id`

## Security

- Helmet security headers are enabled.
- Content Security Policy, Referrer Policy, HSTS in production, and Permissions Policy are configured.
- CORS is restricted with `CORS_ORIGINS`.
- Contact, quote, and admin login routes are rate limited.
- Protected admin API routes are rate limited.
- Inputs are normalized, length-limited, validated, and rejected when HTML/script-like content is detected.
- Admin passwords use bcrypt hashes.
- Admin sessions use signed JWTs.
- `JWT_SECRET` must be at least 32 characters.
- Failed and successful admin logins, exports, and destructive admin actions are written to `activity_logs`.
- Detailed server errors are hidden from users.
- `.env` is ignored by Git. Do not commit secrets.

Run dependency audits:

```bash
npm audit
```

or:

```bash
npm run audit
```

## Backups

Use Supabase backups before deployment changes, migrations, or admin cleanup:

1. In Supabase, open the project dashboard.
2. Go to Database > Backups and confirm automatic backups are active for the project plan.
3. Before running a risky migration, export a manual SQL backup from Supabase SQL Editor or use the Supabase CLI.
4. Keep a copy of the latest `.env` values in a secure password manager, not in Git.
5. Test restore steps on a separate Supabase project before relying on a backup process.

For small free-project exports, you can also export table data from Supabase Table Editor for:

- `contact_messages`
- `quote_requests`
- `admins`
- `activity_logs`

## SEO Files

The project includes:

- `public/sitemap.xml`
- `public/robots.txt`
- Open Graph and Twitter card meta tags
- Custom `404.html` and `error.html`

Replace `https://your-render-service.onrender.com` in HTML meta tags, `sitemap.xml`, and `robots.txt` with your real Render URL or custom domain before production launch.

## Testing

Run syntax and route tests:

```bash
node --check server.js
node --check src/app.js
node --check scripts/seed-admin.js
node --check scripts/test-routes.js
npm run test:routes
npm audit --audit-level=low
```

`npm run test:routes` injects a Prisma-shaped in-memory test client. Production and deployment use Supabase PostgreSQL through Prisma.
