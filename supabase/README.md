# Supabase Setup (Production Mode)

The app runs in **Demo Mode** out of the box (in-memory data, no backend
needed). To switch it to a real Supabase backend:

1. Create a project at [supabase.com](https://supabase.com).
2. From **Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never ship it to the client)
3. Put them in `.env.local` (see `.env.example`).

## Migrations (schema + RLS + demo admin user)

```bash
supabase db push
# or paste supabase/migrations/0001_init.sql into the SQL Editor
```

This creates all tables (`profiles`, `agents`, `properties`,
`property_images`, `leads`, `clients`, `appointments`, `deals`, `inquiries`,
`notifications`, `activity_logs`, `settings`), enables **Row Level Security**
on every table, and seeds the demo admin login:

- Email: `demo@almaktab.ae`
- Password: `demo1234`

## RLS model

| Table            | Public read | Insert | Write / Delete         |
|------------------|-------------|--------|------------------------|
| properties       | ✅ (available only) | —      | admin only            |
| property_images  | ✅          | —      | admin only            |
| agents           | ✅          | —      | admin only            |
| settings         | ✅          | —      | admin only            |
| leads, clients, appointments, deals, notifications, activity_logs, profiles | ❌ | — | admin only |
| inquiries        | ❌          | ✅ anonymous | admin only       |

Every new `auth.users` row gets a matching `profiles` row with role `viewer`
(via trigger); `demo@almaktab.ae` is promoted to `admin` automatically.

## Seed data (same dataset as demo mode)

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx supabase/seed.ts
```

The seed script reads `src/lib/seed-data.ts` (20+ properties, 5+ agents,
20+ leads, 10+ clients, appointments, deals, inquiries, notifications,
activity logs, settings) and inserts it through the service-role client.
Run it after `supabase db push`.

## Notes

- `property_id` / `agent_id` foreign keys are linked during seeding from the
  demo ids; appointment/deal `property_id` are left null because demo data
  references ids that are regenerated per run — re-run the seed after any
  schema reset.
- The `anon` key is safe in the browser; the `service_role` key is not.
