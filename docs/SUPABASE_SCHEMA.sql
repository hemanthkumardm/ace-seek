-- ==============================================================================
-- Ace-Seek Complete Supabase Schema: Projects & API Keys
-- Paste this script into your Supabase Dashboard SQL Editor to initialize or update.
-- ==============================================================================

-- 1. Profiles (Clerk Users)
create table if not exists public.profiles (
  id text primary key,
  email text,
  name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. User API Keys & Subdomain Access Management
create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  key_type text not null check (key_type in ('free', 'trial', 'paid')),
  api_key text not null unique,
  tier text not null check (tier in ('free', 'pro', 'max', 'team')),
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  first_used_at timestamptz,
  expires_at timestamptz
);

create index if not exists idx_user_api_keys_api_key on public.user_api_keys(api_key);
create index if not exists idx_user_api_keys_user_id on public.user_api_keys(user_id);
create index if not exists idx_user_api_keys_email on public.user_api_keys(email);

-- 3. SDC Studio projects (JSON state = full SdcStudioState)
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

create unique index if not exists sdc_projects_one_active_per_user
  on public.sdc_projects (user_id)
  where is_active = true;

-- 4. MMMC Projects
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

-- 5. UPF / Power Projects
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

comment on table public.sdc_projects is 'SDC Studio full state JSON; multi-device via Clerk user_id';
comment on table public.user_api_keys is 'User Free, 7-day Trial, and Paid API license keys';
