# 🏢 المكتب العقاري | Al Maktab Al Aqari

Luxury bilingual (AR/EN, RTL) real-estate platform for the UAE built with
Next.js 15 (App Router). Arabic-first (`ar` default), gold/dark luxury design,
full public site + a complete admin CRM with role-based access, Supabase-ready
(RLS), and a fully-functional **demo mode** that runs with zero configuration.

---

## ✨ Highlights

- **Public site** — home, properties with real filtering/search, buy/rent,
  property details (gallery, map, specs, structured data), agent profiles,
  locations, projects, about, services, contact, favorites (localStorage).
- **Admin suite** — login, KPI dashboard with Recharts, properties CRUD,
  Kanban-style lead CRM, clients, agents, appointments, deals (auto 3%
  commission), inquiries, notifications, activity timeline, users, reports,
  settings. Arabic/English with full RTL.
- **Lead capture everywhere** — property contact forms, viewing requests,
  inquiries and newsletter funnel straight into the CRM.
- **i18n** — `next-intl`, default locale `ar`, `localePrefix: "always"`,
  locale-aware routing/middleware, complete message catalogs.
- **Design** — Tailwind v4, dark mode default, gold `#D4AF37` luxury identity,
  glassmorphism accents, Tajawal + Inter (self-hosted via `@fontsource`),
  RTL-first responsive layout.
- **SEO** — metadata per page, `sitemap.xml`, `robots.txt`, canonical URLs,
  JSON-LD structured data for properties/agents, OpenGraph.
- **Quality** — strict TypeScript, zero-warning ESLint, Vitest suite
  (55 tests), production build verified.

---

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

No backend is required: without Supabase env vars the app runs in **demo mode**
with the seeded dataset (20+ properties, 5+ agents, 20+ leads, 10+ clients,
appointments, deals, notifications, activity, settings) persisted to
`localStorage`.

**Demo admin login** (or click “Demo Access” on the login page):

| Role        | Email                    | Password     |
|-------------|--------------------------|--------------|
| Super Admin | `demo@almaktab.ae`       | `demo1234`   |
| Manager     | `manager@almaktab.ae`    | `manager1234`|
| Agent       | `agent@almaktab.ae`      | `agent1234`  |
| Viewer      | `viewer@almaktab.ae`     | `viewer1234` |

> Demo auth simulates Supabase Auth for previews only. Real deployments use
> Supabase Auth with server-side RBAC — no secrets ship in client code.

---

## 📦 Scripts

| Script              | Purpose                                    |
|---------------------|--------------------------------------------|
| `npm run dev`       | Development server                         |
| `npm run build`     | Production build                           |
| `npm run start`     | Serve the production build                 |
| `npm run lint`      | ESLint (zero-warning gate)                 |
| `npm run typecheck` | `tsc --noEmit`                             |
| `npm run test`      | Vitest (unit tests)                        |
| `npm run check`     | lint + typecheck + test — the quality gate |

---

## 🗂 Project structure

```
src/
  app/
    [locale]/               # localized routes (ar/en)
      admin/…               # full admin suite (dashboard, CRM, reports, …)
      properties/…          # listing + detail
      agents/… locations/… projects/… about services contact favorites
    sitemap.ts robots.ts    # SEO outputs
  components/
    ui/                     # 19 accessible primitives (dialog, select, …)
    layout/ home/ search/ maps/ property/ forms/ admin/
  hooks/                    # auth, theme, favorites, admin data
  lib/
    seed-data.ts            # demo dataset (also used by supabase/seed.ts)
    data-service.ts         # demo ⇄ Supabase switch
    demo/store.ts           # reactive in-memory/localStorage repository
    admin-service.ts auth/ supabase/ query.ts property-filters.ts …
  messages/ar.json en.json  # full bilingual catalogs
  schemas/ types/           # Zod schemas + domain types
supabase/
  migrations/0001_init.sql  # schema + RLS + trigger + demo admin
  seed.ts                   # seeds Supabase from seed-data.ts
```

## 🔐 Production mode (Supabase)

The app is designed to be Vercel-ready with Supabase Auth + Postgres:

1. Copy `.env.example` → `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, used by the seed script only)
2. Apply the migration: `supabase db push`
   (or paste `supabase/migrations/0001_init.sql` into the SQL editor).
3. Seed data: `npx tsx supabase/seed.ts`

The migration creates all tables, enables **Row Level Security** everywhere,
adds an `updated_at` trigger, auto-creates a `profiles` row for every new auth
user, and promotes `demo@almaktab.ae` to `admin`.

**RLS model:** public can read published properties, agents and settings, and
insert inquiries; everything else (leads, clients, appointments, deals,
notifications, activity, profiles) is admin-only, enforced server-side.
Frontend routing gates are cosmetic — the DB is the source of truth.

Full instructions in [`supabase/README.md`](supabase/README.md).

## 🗺 Maps

`react-leaflet` (v5) with vector tiles when `NEXT_PUBLIC_MAPBOX_TOKEN` is set;
otherwise it falls back to OpenStreetMap raster tiles automatically. Maps are
client-only (`ssr: false`) with a skeleton fallback.

---

## 🧪 Tests

```bash
npm run test
```

55 unit tests across utilities, search-param serialization, property
filter/sort/paginate, demo repository, data-service (demo mode), demo auth and
RBAC permissions (including the 20+/5+/20+/10+ seed-data minimums).

---

## 🛠 Tech stack

Next.js 15 · React 19 · TypeScript 5.9 · Tailwind CSS v4 · next-intl ·
react-hook-form + zod · Recharts · react-leaflet · framer-motion · sonner ·
Vitest · Supabase (optional) — versions pinned for stability.

---

## ☁️ Deployment (Vercel)

Build command `npm run build`, output auto-detected. No env vars needed for
demo mode; add the Supabase/Mapbox keys for production mode. The
`[locale]`-scoped routes, `sitemap.xml` and `robots.txt` are generated at
build time.
