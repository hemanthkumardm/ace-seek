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

-- =============================================================================
-- OpenROAD cloud (projects, stage runs, artifacts + Storage)
-- =============================================================================

create table if not exists public.openroad_projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  name text not null default 'openroad-project',
  design_name text not null default 'design',
  top_module text not null default 'top',
  pdk text not null default 'sky130',
  -- Full browser project: files[], stageInputs, completedStages, meta
  state_json jsonb not null default '{}'::jsonb,
  flow_config_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists openroad_projects_user_id_idx
  on public.openroad_projects (user_id);

create index if not exists openroad_projects_user_updated_idx
  on public.openroad_projects (user_id, updated_at desc);

create unique index if not exists openroad_projects_one_active_per_user
  on public.openroad_projects (user_id)
  where is_active = true;

create table if not exists public.openroad_stage_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.openroad_projects (id) on delete cascade,
  user_id text not null references public.profiles (id) on delete cascade,
  stage text not null,
  status text not null default 'done'
    check (status in ('running', 'done', 'failed')),
  summary text,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists openroad_stage_runs_project_idx
  on public.openroad_stage_runs (project_id, created_at desc);

create index if not exists openroad_stage_runs_user_stage_idx
  on public.openroad_stage_runs (user_id, stage, created_at desc);

create table if not exists public.openroad_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.openroad_projects (id) on delete cascade,
  user_id text not null references public.profiles (id) on delete cascade,
  stage text not null,
  name text not null,
  kind text not null default 'other',
  size_bytes bigint not null default 0,
  -- Small text kept inline; large blobs in Storage at storage_path
  content_text text,
  storage_path text,
  mime text default 'text/plain',
  created_at timestamptz not null default now()
);

create index if not exists openroad_artifacts_project_stage_idx
  on public.openroad_artifacts (project_id, stage, created_at desc);

create index if not exists openroad_artifacts_user_idx
  on public.openroad_artifacts (user_id);

-- Storage bucket for large logs / VCD / netlist / GDS
insert into storage.buckets (id, name, public, file_size_limit)
values ('openroad-artifacts', 'openroad-artifacts', false, 52428800)
on conflict (id) do nothing;

-- Service role used by API; RLS optional for anon (we use service role only)
alter table public.openroad_projects enable row level security;
alter table public.openroad_stage_runs enable row level security;
alter table public.openroad_artifacts enable row level security;

comment on table public.openroad_projects is 'OpenROAD Project/Design/Studio state; Clerk user_id';
comment on table public.openroad_artifacts is 'Per-stage logs/reports; large files in storage.openroad-artifacts';
