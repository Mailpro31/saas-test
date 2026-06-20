# 🛫 PaidPilot

**Brand deals & getting paid, on autopilot — for creators and freelancers.**

PaidPilot is a lightweight SaaS that tracks every brand collaboration from first
pitch to paid, turns deals into professional invoices, and **chases late
payments for you** with an escalating reminder sequence. It also gives every
creator a beautiful, shareable **media kit / rate card** at their own URL.

> Why this product? Across ~80 social/search research queries (Reddit, X, Indie
> Hackers, YouTube/TikTok/Instagram, and G2/Capterra reviews), the single most
> recurring, highest-emotion pain for creators and freelancers was **getting
> paid late** (≈85% report it) and the chaos of managing brand deals in
> spreadsheets and DMs. PaidPilot is built squarely on that pain — and its users
> *are* influencers, which makes it naturally easy to market through them.

---

## ✨ Features

- **Deal pipeline** — a visual board (Pitch → Negotiating → Confirmed → In
  progress → Delivered → Invoiced → Paid) with deal values and stage totals.
- **Deliverables & deadlines** — checklist per deal, surfaced on the dashboard
  so nothing is missed.
- **One-click invoices** — generate a clean, printable (Save-as-PDF) invoice from
  any deal, with your payment details baked in.
- **Automated payment-chasing** — draft a 4-step escalation sequence (friendly →
  firm → final notice **with late fee**). Copy to send, or mark as sent.
- **AI assistant (optional)** — reminder and brand-reply drafts written by
  **Claude**. Falls back to high-quality built-in templates when no API key is
  set, so the app is fully functional out of the box.
- **Shareable media kit** — a public rate card at `/m/<your-handle>` with your
  audience stats, packages and a contact CTA. A built-in growth/referral loop.
- **Earnings dashboard** — pipeline value, paid, outstanding and overdue at a
  glance, with a "needs chasing" panel.

## 🧱 Tech stack

- **Next.js 16** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 6** — SQLite for zero-config local dev, Postgres for production
- **jose** (signed session cookies) + **bcryptjs** (password hashing)
- **@anthropic-ai/sdk** (optional Claude integration)

## 🚀 Quickstart

```bash
# 1. Install
npm install

# 2. Configure env (the defaults work for local dev)
cp .env.example .env
#   - AUTH_SECRET: set any long random string (openssl rand -base64 32)
#   - ANTHROPIC_API_KEY: optional, enables Claude-powered drafts

# 3. Create the database and load demo data
npm run db:push
npm run db:seed

# 4. Run
npm run dev
# open http://localhost:3000
```

### Demo account

After seeding you can log in with:

- **Email:** `demo@paidpilot.app`
- **Password:** `demo12345`
- Public media kit: <http://localhost:3000/m/maya-rivera>

## 📜 Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build + typecheck |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Seed the demo account & data |
| `npm run db:reset` | Wipe + recreate + reseed (destructive) |

## ☁️ Deploying to production (Vercel + Postgres)

SQLite is great for local dev but not for serverless. For production:

1. Provision a Postgres database (e.g. **Neon** or **Vercel Postgres**).
2. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set environment variables on your host:
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — a long random string
   - `ANTHROPIC_API_KEY` — optional
4. Run migrations against the database: `npx prisma db push` (the
   `postinstall` hook runs `prisma generate` automatically on deploy).
5. Deploy. On Vercel, push to the repo and import the project — that's it.

> The app runs fully without `ANTHROPIC_API_KEY`; AI drafting simply falls back
> to built-in templates.

## 🗂️ Project structure

```
prisma/
  schema.prisma        # data model (User, Deal, Deliverable, Invoice, Reminder, Package)
  seed.ts              # demo data
src/
  app/
    page.tsx           # marketing landing page
    login / signup     # auth pages
    (app)/             # authenticated app shell (dashboard, deals, invoices, media-kit, settings)
    m/[handle]/        # public media kit
    actions/           # server actions (auth, deals, invoices, reminders, profile)
  components/          # UI + interactive client components
  lib/                 # db, auth, money, dates, AI, reminders, domain helpers
  proxy.ts             # route guard for protected paths
```

## 🔒 Security notes

- Passwords are hashed with bcrypt; sessions are HttpOnly, signed JWT cookies.
- All data access is scoped by the authenticated user's id (multi-tenant safe).
- `AUTH_SECRET` is required and validated at runtime — set a strong value.
