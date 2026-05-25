-- Adoption Analytics — schema + RLS
-- Tracks component usage across GitHub repos and Figma files,
-- detects hardcoded values (rogue usage), and snapshots adoption rate over time.

-- ─── tracked_repos ──────────────────────────────────────────────────────────
create table if not exists public.tracked_repos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null default 'github',
  owner           text not null,
  repo            text not null,
  default_branch  text not null default 'main',
  team            text,
  pat_encrypted   text,
  last_scanned_at timestamptz,
  status          text not null default 'idle', -- idle | scanning | error
  error           text,
  created_at      timestamptz not null default now(),
  unique (user_id, provider, owner, repo)
);
create index if not exists tracked_repos_user_idx on public.tracked_repos (user_id);
create index if not exists tracked_repos_team_idx on public.tracked_repos (team);

-- ─── tracked_figma_files ────────────────────────────────────────────────────
create table if not exists public.tracked_figma_files (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  file_key        text not null,
  file_name       text,
  team            text,
  last_scanned_at timestamptz,
  status          text not null default 'idle',
  created_at      timestamptz not null default now(),
  unique (user_id, file_key)
);
create index if not exists tracked_figma_files_user_idx on public.tracked_figma_files (user_id);

-- ─── component_registry ─────────────────────────────────────────────────────
-- The "available" set — what could be used.
create table if not exists public.component_registry (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  component_name  text not null,
  source          text not null default 'design-system', -- design-system | figma
  category        text,
  created_at      timestamptz not null default now(),
  unique (user_id, component_name, source)
);
create index if not exists component_registry_user_idx on public.component_registry (user_id);

-- ─── scan_runs ──────────────────────────────────────────────────────────────
create table if not exists public.scan_runs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  kind            text not null, -- github | figma
  target_id       uuid not null, -- tracked_repos.id or tracked_figma_files.id
  status          text not null default 'running', -- running | success | error
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  files_scanned   int not null default 0,
  components_seen int not null default 0,
  rogue_count     int not null default 0,
  error           text
);
create index if not exists scan_runs_user_idx on public.scan_runs (user_id, started_at desc);

-- ─── component_usage ────────────────────────────────────────────────────────
-- One row per (scan, repo/file, file_path, component) — collapsed observation.
create table if not exists public.component_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  scan_id         uuid not null references public.scan_runs(id) on delete cascade,
  source_kind     text not null, -- github | figma
  source_id       uuid not null,
  team            text,
  component_name  text not null,
  file_path       text,
  occurrences     int not null default 1,
  scanned_at      timestamptz not null default now()
);
create index if not exists component_usage_user_idx     on public.component_usage (user_id);
create index if not exists component_usage_component_idx on public.component_usage (user_id, component_name);
create index if not exists component_usage_scan_idx     on public.component_usage (scan_id);
create index if not exists component_usage_team_idx     on public.component_usage (team);

-- ─── rogue_usage ────────────────────────────────────────────────────────────
-- Hardcoded values that should be tokens.
create table if not exists public.rogue_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  scan_id         uuid not null references public.scan_runs(id) on delete cascade,
  source_kind     text not null,
  source_id       uuid not null,
  team            text,
  file_path       text not null,
  line            int,
  snippet         text,
  kind            text not null, -- color | spacing | radius | shadow | font-size
  raw_value       text not null,
  suggested_token text,
  scanned_at      timestamptz not null default now()
);
create index if not exists rogue_usage_user_idx on public.rogue_usage (user_id);
create index if not exists rogue_usage_kind_idx on public.rogue_usage (user_id, kind);
create index if not exists rogue_usage_scan_idx on public.rogue_usage (scan_id);

-- ─── adoption_snapshots ─────────────────────────────────────────────────────
-- Daily-grain rollup for trend charts.
create table if not exists public.adoption_snapshots (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  taken_at        date not null default current_date,
  component_name  text, -- null = overall
  team            text, -- null = all teams
  used_count      int not null default 0,
  available_count int not null default 0,
  rate            numeric(5,4) not null default 0, -- 0.0000–1.0000
  rogue_count     int not null default 0
);
create index if not exists adoption_snapshots_user_idx on public.adoption_snapshots (user_id, taken_at desc);
-- Functional unique index (expressions aren't allowed inline in table-level UNIQUE).
create unique index if not exists adoption_snapshots_dedup_idx
  on public.adoption_snapshots (user_id, taken_at, coalesce(component_name, ''), coalesce(team, ''));

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.tracked_repos       enable row level security;
alter table public.tracked_figma_files enable row level security;
alter table public.component_registry  enable row level security;
alter table public.scan_runs           enable row level security;
alter table public.component_usage     enable row level security;
alter table public.rogue_usage         enable row level security;
alter table public.adoption_snapshots  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'tracked_repos','tracked_figma_files','component_registry',
    'scan_runs','component_usage','rogue_usage','adoption_snapshots'
  ] loop
    execute format($f$
      create policy "%1$s: owner read"   on public.%1$s for select using (auth.uid() = user_id);
      create policy "%1$s: owner insert" on public.%1$s for insert with check (auth.uid() = user_id);
      create policy "%1$s: owner update" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy "%1$s: owner delete" on public.%1$s for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end$$;
