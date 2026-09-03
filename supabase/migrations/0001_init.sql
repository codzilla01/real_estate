-- ============================================================================
-- Al Maktab Al Aqari — initial schema, RLS and triggers
-- Run via: supabase db push   (or paste into the SQL editor)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Roles
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'agent', 'viewer');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Profiles (one row per auth user; created automatically by trigger)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  role        public.app_role not null default 'viewer',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Agents
-- ----------------------------------------------------------------------------
create table if not exists public.agents (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  photo             text,
  phone             text not null,
  whatsapp          text,
  email             text,
  bio_ar            text,
  bio_en            text,
  languages         text[] not null default '{}',
  areas             text[] not null default '{}',
  specialties       text[] not null default '{}',
  experience_years  int not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Properties
-- ----------------------------------------------------------------------------
create table if not exists public.properties (
  id                 uuid primary key default uuid_generate_v4(),
  slug               text not null unique,
  title_ar           text not null,
  title_en           text not null,
  description_ar     text not null,
  description_en     text not null,
  type               text not null,
  deal_type          text not null check (deal_type in ('sale', 'rent')),
  status             text not null default 'available'
                     check (status in ('available', 'sold', 'rented', 'reserved')),
  price              numeric not null check (price >= 0),
  currency           text not null default 'AED',
  area               numeric not null check (area > 0),
  bedrooms           int not null default 0,
  bathrooms          int not null default 0,
  parking            int not null default 0,
  year_built         int,
  furnished          boolean not null default false,
  city               text not null,
  area_name          text,
  address            text,
  latitude           numeric not null default 25.2048,
  longitude          numeric not null default 55.2708,
  amenities          text[] not null default '{}',
  features           text[] not null default '{}',
  agent_id           uuid references public.agents (id) on delete set null,
  featured           boolean not null default false,
  is_new             boolean not null default false,
  is_hot             boolean not null default false,
  published_at       timestamptz not null default now(),
  views              int not null default 0,
  seo_title_ar       text,
  seo_title_en       text,
  seo_description_ar text,
  seo_description_en text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists properties_deal_status_idx on public.properties (deal_type, status);
create index if not exists properties_city_idx on public.properties (city);
create index if not exists properties_type_idx on public.properties (type);
create index if not exists properties_featured_idx on public.properties (featured) where featured;

-- ----------------------------------------------------------------------------
-- Property images
-- ----------------------------------------------------------------------------
create table if not exists public.property_images (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url         text not null,
  alt_ar      text,
  alt_en      text,
  is_cover    boolean not null default false,
  sort_order  int not null default 0
);

create index if not exists property_images_property_idx on public.property_images (property_id, sort_order);

-- ----------------------------------------------------------------------------
-- Leads
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  phone          text not null,
  email          text,
  source         text not null default 'website',
  property_id    uuid references public.properties (id) on delete set null,
  budget         numeric,
  location       text,
  agent_id       uuid references public.agents (id) on delete set null,
  priority       text not null default 'warm' check (priority in ('hot', 'warm', 'cold')),
  status         text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'viewing', 'negotiation', 'closed', 'lost')),
  notes          text,
  next_follow_up date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_priority_idx on public.leads (priority);

-- ----------------------------------------------------------------------------
-- Clients
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  phone             text not null,
  whatsapp          text,
  email             text,
  budget            numeric,
  interested_areas  text[] not null default '{}',
  property_types    text[] not null default '{}',
  bedrooms          int,
  notes             text,
  agent_id          uuid references public.agents (id) on delete set null,
  status            text not null default 'active' check (status in ('active', 'inactive', 'lead')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Appointments
-- ----------------------------------------------------------------------------
create table if not exists public.appointments (
  id           uuid primary key default uuid_generate_v4(),
  type         text not null check (type in ('viewing', 'call', 'meeting', 'follow_up')),
  property_id  uuid references public.properties (id) on delete set null,
  client_name  text,
  client_phone text,
  agent_id     uuid references public.agents (id) on delete set null,
  date         date not null,
  time         text,
  status       text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Deals
-- ----------------------------------------------------------------------------
create table if not exists public.deals (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references public.properties (id) on delete restrict,
  client_name  text not null,
  agent_id     uuid references public.agents (id) on delete set null,
  type         text not null check (type in ('sale', 'rent')),
  amount       numeric not null check (amount >= 0),
  commission   numeric not null default 0,
  status       text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  date         date not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Inquiries (public contact form submissions)
-- ----------------------------------------------------------------------------
create table if not exists public.inquiries (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  phone        text not null,
  email        text,
  subject      text,
  message      text not null,
  property_id  uuid references public.properties (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Notifications
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  title_ar    text not null,
  title_en    text not null,
  message_ar  text,
  message_en  text,
  type        text not null default 'info',
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Activity logs
-- ----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users (id) on delete set null,
  action       text not null,
  entity_type  text,
  entity_id    text,
  entity_label text,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- Settings (single row, id = 'default')
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  id                 text primary key default 'default',
  company_name_ar    text not null,
  company_name_en    text not null,
  phone              text not null,
  whatsapp           text not null,
  email              text not null,
  address_ar         text,
  address_en         text,
  facebook           text,
  instagram          text,
  twitter            text,
  linkedin           text,
  currency           text not null default 'AED',
  default_language   text not null default 'ar',
  default_theme      text not null default 'dark',
  seo_title_ar       text,
  seo_title_en       text,
  seo_description_ar text,
  seo_description_en text,
  updated_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['agents', 'properties', 'leads', 'clients', 'appointments', 'deals', 'settings']
  loop
    execute format('drop trigger if exists set_updated_at_%s on public.%I', t, t);
    execute format('create trigger set_updated_at_%s before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- New user → profile trigger
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when new.email = 'demo@almaktab.ae' then 'admin'::public.app_role else 'viewer'::public.app_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- RLS: enable on all tables
-- ----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.agents         enable row level security;
alter table public.properties     enable row level security;
alter table public.property_images enable row level security;
alter table public.leads          enable row level security;
alter table public.clients        enable row level security;
alter table public.appointments   enable row level security;
alter table public.deals          enable row level security;
alter table public.inquiries      enable row level security;
alter table public.notifications  enable row level security;
alter table public.activity_logs  enable row level security;
alter table public.settings       enable row level security;

-- ----------------------------------------------------------------------------
-- Helper: is the current user an admin?
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- Policies
-- Public: read published content (properties, images, agents, settings).
-- Admin only: write + read private CRM data (leads, clients, appointments,
-- deals, inquiries, notifications, activity logs, profiles).
-- ----------------------------------------------------------------------------

-- Profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Agents: everyone can read, only admins write
drop policy if exists agents_read on public.agents;
create policy agents_read on public.agents
  for select using (true);
drop policy if exists agents_write on public.agents;
create policy agents_write on public.agents
  for all using (public.is_admin()) with check (public.is_admin());

-- Properties: public read of published, admin full access
drop policy if exists properties_read on public.properties;
create policy properties_read on public.properties
  for select using (status = 'available' or public.is_admin());
drop policy if exists properties_write on public.properties;
create policy properties_write on public.properties
  for all using (public.is_admin()) with check (public.is_admin());

-- Property images
drop policy if exists property_images_read on public.property_images;
create policy property_images_read on public.property_images
  for select using (true);
drop policy if exists property_images_write on public.property_images;
create policy property_images_write on public.property_images
  for all using (public.is_admin()) with check (public.is_admin());

-- Leads (private CRM)
drop policy if exists leads_all on public.leads;
create policy leads_all on public.leads
  for all using (public.is_admin()) with check (public.is_admin());

-- Clients (private CRM)
drop policy if exists clients_all on public.clients;
create policy clients_all on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

-- Appointments (private CRM)
drop policy if exists appointments_all on public.appointments;
create policy appointments_all on public.appointments
  for all using (public.is_admin()) with check (public.is_admin());

-- Deals (private CRM)
drop policy if exists deals_all on public.deals;
create policy deals_all on public.deals
  for all using (public.is_admin()) with check (public.is_admin());

-- Inquiries: anyone may submit (insert), only admins read
drop policy if exists inquiries_insert on public.inquiries;
create policy inquiries_insert on public.inquiries
  for insert with check (true);
drop policy if exists inquiries_read on public.inquiries;
create policy inquiries_read on public.inquiries
  for select using (public.is_admin());

-- Notifications (admin only)
drop policy if exists notifications_all on public.notifications;
create policy notifications_all on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- Activity logs (admin only)
drop policy if exists activity_logs_all on public.activity_logs;
create policy activity_logs_all on public.activity_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- Settings: public read (used to render site config), admin write
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings
  for select using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Demo admin user (password: demo1234)
-- ----------------------------------------------------------------------------
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'demo@almaktab.ae',
  crypt('demo1234', gen_salt('bf')),
  now(),
  jsonb_build_object('name', 'Demo Admin'),
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.profiles (id, name, role)
values ('00000000-0000-0000-0000-000000000001', 'Demo Admin', 'admin')
on conflict (id) do nothing;

insert into public.settings (id, company_name_ar, company_name_en, phone, whatsapp, email)
values (
  'default',
  'المكتب العقاري',
  'Al Maktab Al Aqari',
  '+971 4 000 0000',
  '971500000000',
  'info@almaktab.ae'
)
on conflict (id) do nothing;
