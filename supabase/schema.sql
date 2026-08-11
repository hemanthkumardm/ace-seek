-- Ace-Seek VLSI cloud projects (Supabase free Postgres)
-- Run in Supabase SQL Editor once.
-- Auth is Clerk: API routes use service role + Clerk userId filter (not Supabase Auth).

-- Profiles mirror Clerk users (id = Clerk user_xxx)
create table if not exists public.profiles (
  id text primary key,
  email text,
  name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
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
