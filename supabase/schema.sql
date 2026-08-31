-- Ace-Seek VLSI cloud projects (Supabase free Postgres)
-- Run in Supabase SQL Editor once.
-- Auth is Clerk: API routes use service role + Clerk userId filter (not Supabase Auth).

-- Profiles mirror Clerk users (id = Clerk user_xxx)
create table if not exists public.profiles (
  id text primary key,
  email text,
  name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'max', 'team')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SDC Studio projects (JSON state = full SdcStudioState)
create table if not exists public.sdc_projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  name text not null default 'Untitled SDC',
  design_name text,
  vendor text,
  tool text,
  state_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sdc_projects_user_id_idx
  on public.sdc_projects (user_id);

create index if not exists sdc_projects_user_updated_idx
  on public.sdc_projects (user_id, updated_at desc);

-- At most one active project per user (partial unique)
create unique index if not exists sdc_projects_one_active_per_user
  on public.sdc_projects (user_id)
  where is_active = true;

-- Optional: MMMC / UPF placeholders for next iteration
create table if not exists public.mmmc_projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  name text not null default 'Untitled MMMC',
  state_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mmmc_projects_user_id_idx
  on public.mmmc_projects (user_id);

create table if not exists public.upf_projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  name text not null default 'Untitled UPF',
  state_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists upf_projects_user_id_idx
  on public.upf_projects (user_id);

-- Free-tier safety: optional row count note (enforce in app: max 20 projects free)

comment on table public.sdc_projects is 'SDC Studio full state JSON; multi-device via Clerk user_id';

-- Manual 7-day Max trial requests (approve → email API key)
create table if not exists public.trial_requests (
  id text primary key,
  name text not null,
  email text not null,
  qualification text not null,
  organization text not null,
  affiliation text not null default 'other',
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  api_key text,
  plan text not null default 'max',
  trial_starts_at timestamptz,
  trial_expires_at timestamptz,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trial_requests_email_pending_idx
  on public.trial_requests (email)
  where status = 'pending';

create index if not exists trial_requests_email_idx
  on public.trial_requests (email);

create unique index if not exists trial_requests_api_key_idx
  on public.trial_requests (api_key)
  where api_key is not null;

comment on table public.trial_requests is 'Manual Max trial: request → founder review → emailed API key, 7-day expiry';

-- Existing installs: widen profiles.plan to include max
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'pro', 'max', 'team'));
