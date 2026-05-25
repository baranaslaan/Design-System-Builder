-- ============================================================================
-- Consolidated migrations (0001 → 0010). Paste in one shot.
-- Generated: Sun May 24 22:33:09 +03 2026
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0001_baseline.sql
-- ─────────────────────────────────────────────────────────────
-- Baseline schema — profiles + token_sets (referenced by src/lib/supabase/client.ts).
-- This migration is IDEMPOTENT: safe to run even if the tables were created
-- manually via the Studio in earlier work. It only adds what's missing.

-- ─── profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles: self read') then
    create policy "profiles: self read"   on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles: self upsert') then
    create policy "profiles: self upsert" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles: self update') then
    create policy "profiles: self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- Auto-create a profile row on auth.users insert (no-op if a row already exists).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── token_sets ────────────────────────────────────────────────────────────
create table if not exists public.token_sets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  tokens     jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists token_sets_user_idx on public.token_sets (user_id);

alter table public.token_sets enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='token_sets' and policyname='token_sets: owner all') then
    create policy "token_sets: owner all" on public.token_sets for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0002_figma_sync.sql
-- ─────────────────────────────────────────────────────────────
-- Figma two-way token sync — schema + RLS
-- Apply via Supabase CLI:  supabase db push
-- or paste into Supabase SQL editor.

-- ─── figma_links ────────────────────────────────────────────────────────────
-- One row per (user, Figma file). Holds the last-synced baseline used by the
-- 3-way merge in src/lib/figma/conflict.ts. baseline_leaves is a JSONB array
-- of TokenLeaf ({ path, type, value, description? }).

create table if not exists public.figma_links (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  file_key        text not null,
  file_name       text,
  baseline_leaves jsonb not null default '[]'::jsonb,
  last_synced_at  timestamptz not null default now(),

  unique (user_id, file_key)
);

create index if not exists figma_links_user_idx on public.figma_links (user_id);

alter table public.figma_links enable row level security;

create policy "figma_links: owner read"
  on public.figma_links for select
  using (auth.uid() = user_id);

create policy "figma_links: owner write"
  on public.figma_links for insert
  with check (auth.uid() = user_id);

create policy "figma_links: owner update"
  on public.figma_links for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "figma_links: owner delete"
  on public.figma_links for delete
  using (auth.uid() = user_id);

-- ─── sync_logs ──────────────────────────────────────────────────────────────
-- Append-only audit trail of every pull/push/sync attempt. `changes` is the
-- SyncLogEntry.changes JSON: { pushed, pulled, skipped, unsupported }.

create table if not exists public.sync_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  file_key        text not null,
  direction       text not null check (direction in ('pull','push','sync')),
  conflicts_count integer not null default 0,
  changes         jsonb not null default '{}'::jsonb,
  error           text,
  created_at      timestamptz not null default now()
);

create index if not exists sync_logs_user_time_idx
  on public.sync_logs (user_id, created_at desc);

create index if not exists sync_logs_user_file_idx
  on public.sync_logs (user_id, file_key);

alter table public.sync_logs enable row level security;

create policy "sync_logs: owner read"
  on public.sync_logs for select
  using (auth.uid() = user_id);

create policy "sync_logs: owner insert"
  on public.sync_logs for insert
  with check (auth.uid() = user_id);

-- No update/delete policies: logs are append-only.

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0003_adoption.sql
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0004_audit.sql
-- ─────────────────────────────────────────────────────────────
-- Consistency Audit — schema + RLS
-- One audit_run aggregates findings from any combination of repos + figma files.

create table if not exists public.audit_runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  trigger       text not null default 'manual', -- manual | ci | scheduled
  status        text not null default 'running', -- running | success | error
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  use_ai        boolean not null default false,
  ai_model      text,
  summary       jsonb not null default '{}'::jsonb, -- {critical,warning,info,total,by_kind:{...}}
  error         text
);
create index if not exists audit_runs_user_idx on public.audit_runs (user_id, started_at desc);

create table if not exists public.audit_findings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  run_id          uuid not null references public.audit_runs(id) on delete cascade,
  source_kind     text not null, -- github | figma
  source_id       uuid,
  source_label    text,          -- "owner/repo" or figma file name
  severity        text not null, -- critical | warning | info
  kind            text not null, -- color | spacing | radius | shadow | font-size | figma-fill | figma-text | figma-stroke
  location        text not null, -- "path/file.tsx:42" or "Frame > Component / Variant"
  raw_value       text not null,
  suggested_token text,
  confidence      numeric(3,2),  -- 0.00–1.00
  ai_reason       text,
  created_at      timestamptz not null default now()
);
create index if not exists audit_findings_user_idx     on public.audit_findings (user_id);
create index if not exists audit_findings_run_idx      on public.audit_findings (run_id);
create index if not exists audit_findings_sev_idx      on public.audit_findings (user_id, severity);

alter table public.audit_runs     enable row level security;
alter table public.audit_findings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['audit_runs','audit_findings'] loop
    execute format($f$
      create policy "%1$s: owner read"   on public.%1$s for select using (auth.uid() = user_id);
      create policy "%1$s: owner insert" on public.%1$s for insert with check (auth.uid() = user_id);
      create policy "%1$s: owner update" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy "%1$s: owner delete" on public.%1$s for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end$$;

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0005_scoring.sql
-- ─────────────────────────────────────────────────────────────
-- Per-component A11y + Brand scoring snapshots.
-- One row per (component_id, run_id). A "run" groups all components scored
-- together at a moment in time so we can compare runs for diffs.

create table if not exists public.scoring_runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  trigger       text not null default 'manual', -- manual | auto-update
  taken_at      timestamptz not null default now(),
  tokens_hash   text,                            -- hash of tokens at run time
  avg_a11y      numeric(5,2),
  avg_brand     numeric(5,2),
  component_n   int not null default 0
);
create index if not exists scoring_runs_user_idx on public.scoring_runs (user_id, taken_at desc);

create table if not exists public.component_scores (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  run_id        uuid not null references public.scoring_runs(id) on delete cascade,
  component_id  text not null,                   -- e.g. "Button", "Input"
  variant       text,                            -- "primary", "ghost", null = aggregate
  a11y_score    numeric(5,2) not null default 0, -- 0–100
  brand_score   numeric(5,2) not null default 0, -- 0–100
  breakdown     jsonb not null default '{}'::jsonb,
  -- breakdown shape:
  -- {
  --   a11y: { contrast:90, touch:100, focus:80, scaling:100, issues:[{id,severity,msg,el}] },
  --   brand:{ colorCoverage:0.9, fontCoverage:1, spacingCoverage:0.85, offTokens:[{kind,raw}] }
  -- }
  created_at    timestamptz not null default now()
);
create index if not exists component_scores_user_idx on public.component_scores (user_id);
create index if not exists component_scores_run_idx  on public.component_scores (run_id);
create index if not exists component_scores_comp_idx on public.component_scores (user_id, component_id);

alter table public.scoring_runs     enable row level security;
alter table public.component_scores enable row level security;

do $$
declare t text;
begin
  foreach t in array array['scoring_runs','component_scores'] loop
    execute format($f$
      create policy "%1$s: owner read"   on public.%1$s for select using (auth.uid() = user_id);
      create policy "%1$s: owner insert" on public.%1$s for insert with check (auth.uid() = user_id);
      create policy "%1$s: owner update" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy "%1$s: owner delete" on public.%1$s for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end$$;

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0006_brands.sql
-- ─────────────────────────────────────────────────────────────
-- Multi-brand token management.
--
-- Layers (lowest → highest precedence):
--   core             — global primitives. one row per system-admin org.
--   semantic_global  — semantic defaults (overrideable by brands).
--   semantic_brand   — a brand's semantic overrides.
--   brand            — a brand's full overrides (any leaf token).
--
-- Overrides are stored as a flat path map:
--   { "colors.semantic.primary.lightValue": "#7c3aed", "spacing.4": "20px" }
-- The core layer keeps the FULL DesignTokens object (since it is the base).

-- ─── brands ─────────────────────────────────────────────────────────────────
create table if not exists public.brands (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  slug            text not null,
  parent_brand_id uuid references public.brands(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (owner_id, slug)
);
create index if not exists brands_owner_idx on public.brands (owner_id);

-- ─── brand_members ──────────────────────────────────────────────────────────
-- Membership table that drives RBAC inside the app's RLS expressions.
create table if not exists public.brand_members (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references public.brands(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('admin','editor','viewer')),
  created_at  timestamptz not null default now(),
  unique (brand_id, user_id)
);
create index if not exists brand_members_user_idx  on public.brand_members (user_id);
create index if not exists brand_members_brand_idx on public.brand_members (brand_id);

-- ─── token_layers ───────────────────────────────────────────────────────────
-- For kind='core' or 'semantic_global', brand_id is NULL (global).
-- For kind='semantic_brand' or 'brand', brand_id is the specific brand.
create table if not exists public.token_layers (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  brand_id    uuid references public.brands(id) on delete cascade,
  kind        text not null check (kind in ('core','semantic_global','semantic_brand','brand')),
  -- For kind='core': full DesignTokens object.
  -- Other kinds: sparse path-map { "path.to.key": <scalar> }.
  payload     jsonb not null default '{}'::jsonb,
  version     int not null default 1,
  locked      boolean not null default false,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  -- A given (owner, scope, kind) is unique.
  unique (owner_id, brand_id, kind)
);
create index if not exists token_layers_owner_idx on public.token_layers (owner_id);
create index if not exists token_layers_brand_idx on public.token_layers (brand_id);

-- ─── merge_conflicts ────────────────────────────────────────────────────────
-- Generated when 'core' is updated and a brand has overlapping overrides.
create table if not exists public.merge_conflicts (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  brand_id        uuid not null references public.brands(id) on delete cascade,
  core_version_from int not null,
  core_version_to   int not null,
  status          text not null default 'open' check (status in ('open','resolved')),
  -- conflicts: [{ path, brand_value, old_core, new_core, resolution: 'keep_brand'|'accept_core'|null }]
  conflicts       jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);
create index if not exists merge_conflicts_brand_idx on public.merge_conflicts (brand_id, status);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.brands          enable row level security;
alter table public.brand_members   enable row level security;
alter table public.token_layers    enable row level security;
alter table public.merge_conflicts enable row level security;

-- brands: owner can do anything; members can read.
create policy "brands: owner all"     on public.brands for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "brands: member read"   on public.brands for select
  using (exists (select 1 from public.brand_members m where m.brand_id = brands.id and m.user_id = auth.uid()));

-- brand_members: owner manages; users see their own row.
create policy "members: owner all"    on public.brand_members for all
  using (exists (select 1 from public.brands b where b.id = brand_members.brand_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.brands b where b.id = brand_members.brand_id and b.owner_id = auth.uid()));
create policy "members: self read"    on public.brand_members for select
  using (auth.uid() = user_id);

-- token_layers:
--   read: owner OR member of the brand (or global layers — null brand_id — for any owner row).
--   write: depends on kind (enforced in API too; RLS just gates owner).
create policy "layers: owner all"     on public.token_layers for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "layers: member read"   on public.token_layers for select
  using (
    brand_id is not null
    and exists (select 1 from public.brand_members m where m.brand_id = token_layers.brand_id and m.user_id = auth.uid())
  );

-- merge_conflicts: owner manages, brand admins/editors read+update.
create policy "conflicts: owner all"  on public.merge_conflicts for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "conflicts: member rw"  on public.merge_conflicts for select
  using (exists (select 1 from public.brand_members m where m.brand_id = merge_conflicts.brand_id and m.user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0007_onboarding.sql
-- ─────────────────────────────────────────────────────────────
-- Onboarding progress + first-visit tooltip tracking.

create table if not exists public.onboarding_progress (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  role                 text check (role in ('designer','developer','manager')),
  completed_steps      text[] not null default '{}',
  badges               text[] not null default '{}',
  certificate_issued_at timestamptz,
  updated_at           timestamptz not null default now()
);

create table if not exists public.tooltips_seen (
  user_id     uuid not null references auth.users(id) on delete cascade,
  tooltip_id  text not null,
  seen_at     timestamptz not null default now(),
  primary key (user_id, tooltip_id)
);

alter table public.onboarding_progress enable row level security;
alter table public.tooltips_seen       enable row level security;

create policy "onboarding: self all" on public.onboarding_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tooltips: self all"   on public.tooltips_seen for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0008_fix_perms_and_recursion.sql
-- ─────────────────────────────────────────────────────────────
-- Fix two issues surfaced by /api/health:
-- 1) "permission denied for table X" — authenticated role lacks base GRANTs.
-- 2) "infinite recursion detected in policy for relation 'brands'" — the
--    brands ↔ brand_members policies query each other, causing PostgREST
--    to loop. We replace them with SECURITY DEFINER helper functions.

-- ─── 1) Base grants for the authenticated role ──────────────────────────────
-- RLS still gates per-row access; this just lets the role touch the table at all.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                                   on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public grant usage, select                  on sequences to authenticated;

-- ─── 2) Helper functions (bypass RLS to break recursion) ────────────────────
create or replace function public.user_owns_brand(b uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.brands where id = b and owner_id = auth.uid())
$$;
revoke all on function public.user_owns_brand(uuid) from public;
grant execute on function public.user_owns_brand(uuid) to authenticated;

create or replace function public.user_is_brand_member(b uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.brand_members where brand_id = b and user_id = auth.uid())
$$;
revoke all on function public.user_is_brand_member(uuid) from public;
grant execute on function public.user_is_brand_member(uuid) to authenticated;

-- ─── 3) Replace the recursive policies ──────────────────────────────────────
-- brands.member_read — was: exists(select from brand_members ...)
drop policy if exists "brands: member read" on public.brands;
create policy "brands: member read" on public.brands for select
  using (public.user_is_brand_member(id));

-- brand_members.owner_all — was: exists(select from brands ...)
drop policy if exists "members: owner all" on public.brand_members;
create policy "members: owner all" on public.brand_members for all
  using (public.user_owns_brand(brand_id))
  with check (public.user_owns_brand(brand_id));

-- token_layers.member_read — also touched brand_members
drop policy if exists "layers: member read" on public.token_layers;
create policy "layers: member read" on public.token_layers for select
  using (brand_id is not null and public.user_is_brand_member(brand_id));

-- merge_conflicts.member_rw — same recursion path
drop policy if exists "conflicts: member rw" on public.merge_conflicts;
create policy "conflicts: member rw" on public.merge_conflicts for select
  using (public.user_is_brand_member(brand_id));

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0009_security_hardening.sql
-- ─────────────────────────────────────────────────────────────
-- Security hardening pass.
-- Addresses findings from the white-hat audit:
--  • Cross-tenant writes via INSERT policies that only check auth.uid()=user_id
--    but never verify the referenced parent row belongs to the caller.
--  • Overly broad GRANT ALL ... TO authenticated covering future tables.
--  • SECURITY DEFINER helpers lacked SET search_path.
--  • token_layers INSERT did not constrain brand_id to a brand the caller
--    actually owns / administers.

-- ─── 1) Pin search_path on the SECURITY DEFINER helpers ─────────────────────
create or replace function public.user_owns_brand(b uuid)
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.brands where id = b and owner_id = auth.uid())
$$;

create or replace function public.user_is_brand_member(b uuid)
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.brand_members where brand_id = b and user_id = auth.uid())
$$;

-- ─── 2) Stop granting writes on future tables blindly ───────────────────────
-- We keep present grants (0008 already issued them) but cancel the default
-- privilege catch-all so a new table without explicit GRANTs stays locked
-- to authenticated by default. RLS still gates rows.
alter default privileges in schema public revoke insert, update, delete on tables    from authenticated;
alter default privileges in schema public revoke all                     on sequences from authenticated;

-- ─── 3) Lock down token_layers INSERTs against cross-tenant poisoning ───────
-- Previously: any authed user could INSERT a row pointing at someone else's
-- brand_id as long as owner_id=self. Now: brand_id must be NULL (global,
-- and only the row owner can write that) OR a brand the caller owns.
do $$
declare p_name text;
begin
  for p_name in
    select policyname from pg_policies
    where schemaname='public' and tablename='token_layers'
  loop
    execute format('drop policy if exists %I on public.token_layers', p_name);
  end loop;
end $$;

create policy "layers: owner select" on public.token_layers for select
  using (auth.uid() = owner_id);
create policy "layers: member select" on public.token_layers for select
  using (brand_id is not null and public.user_is_brand_member(brand_id));
create policy "layers: owner insert" on public.token_layers for insert
  with check (
    auth.uid() = owner_id
    and (brand_id is null or public.user_owns_brand(brand_id))
  );
create policy "layers: owner update" on public.token_layers for update
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and (brand_id is null or public.user_owns_brand(brand_id))
  );
create policy "layers: owner delete" on public.token_layers for delete
  using (auth.uid() = owner_id);

-- ─── 4) merge_conflicts must reference the same brand it claims ─────────────
do $$
declare p_name text;
begin
  for p_name in
    select policyname from pg_policies
    where schemaname='public' and tablename='merge_conflicts'
  loop
    execute format('drop policy if exists %I on public.merge_conflicts', p_name);
  end loop;
end $$;

create policy "conflicts: owner select" on public.merge_conflicts for select
  using (auth.uid() = owner_id);
create policy "conflicts: member select" on public.merge_conflicts for select
  using (public.user_is_brand_member(brand_id));
create policy "conflicts: owner insert" on public.merge_conflicts for insert
  with check (
    auth.uid() = owner_id
    and exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid())
  );
create policy "conflicts: owner update" on public.merge_conflicts for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
create policy "conflicts: owner delete" on public.merge_conflicts for delete
  using (auth.uid() = owner_id);

-- ─── 5) Child rows must reference parents owned by the caller ───────────────
-- scan_runs: target_id refers either to tracked_repos or tracked_figma_files.
-- We can't enforce both via FK, but RLS WITH CHECK can.
drop policy if exists "scan_runs: owner all"     on public.scan_runs;
drop policy if exists "scan_runs: owner read"    on public.scan_runs;
drop policy if exists "scan_runs: owner insert"  on public.scan_runs;
drop policy if exists "scan_runs: owner update"  on public.scan_runs;
drop policy if exists "scan_runs: owner delete"  on public.scan_runs;

create policy "scan_runs: owner select" on public.scan_runs for select
  using (auth.uid() = user_id);
create policy "scan_runs: owner insert" on public.scan_runs for insert
  with check (
    auth.uid() = user_id
    and (
      (kind = 'github' and exists (select 1 from public.tracked_repos       r where r.id = target_id and r.user_id = auth.uid()))
      or (kind = 'figma' and exists (select 1 from public.tracked_figma_files f where f.id = target_id and f.user_id = auth.uid()))
    )
  );
create policy "scan_runs: owner update" on public.scan_runs for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scan_runs: owner delete" on public.scan_runs for delete
  using (auth.uid() = user_id);

-- component_usage / rogue_usage must reference a scan_run the caller owns.
do $$
declare t text;
begin
  foreach t in array array['component_usage','rogue_usage'] loop
    execute format('drop policy if exists "%1$s: owner read"   on public.%1$s', t);
    execute format('drop policy if exists "%1$s: owner insert" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: owner update" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: owner delete" on public.%1$s', t);
    execute format($f$
      create policy "%1$s: owner select" on public.%1$s for select
        using (auth.uid() = user_id);
      create policy "%1$s: owner insert" on public.%1$s for insert
        with check (
          auth.uid() = user_id
          and exists (select 1 from public.scan_runs s where s.id = scan_id and s.user_id = auth.uid())
        );
      create policy "%1$s: owner delete" on public.%1$s for delete
        using (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- audit_findings → audit_runs
drop policy if exists "audit_findings: owner read"   on public.audit_findings;
drop policy if exists "audit_findings: owner insert" on public.audit_findings;
drop policy if exists "audit_findings: owner update" on public.audit_findings;
drop policy if exists "audit_findings: owner delete" on public.audit_findings;

create policy "audit_findings: owner select" on public.audit_findings for select
  using (auth.uid() = user_id);
create policy "audit_findings: owner insert" on public.audit_findings for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.audit_runs r where r.id = run_id and r.user_id = auth.uid())
  );
create policy "audit_findings: owner delete" on public.audit_findings for delete
  using (auth.uid() = user_id);

-- component_scores → scoring_runs
drop policy if exists "component_scores: owner read"   on public.component_scores;
drop policy if exists "component_scores: owner insert" on public.component_scores;
drop policy if exists "component_scores: owner update" on public.component_scores;
drop policy if exists "component_scores: owner delete" on public.component_scores;

create policy "component_scores: owner select" on public.component_scores for select
  using (auth.uid() = user_id);
create policy "component_scores: owner insert" on public.component_scores for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.scoring_runs r where r.id = run_id and r.user_id = auth.uid())
  );
create policy "component_scores: owner delete" on public.component_scores for delete
  using (auth.uid() = user_id);

-- ─── 6) brand_members: ensure role + user_id are not abused on INSERT ───────
do $$
declare p_name text;
begin
  for p_name in
    select policyname from pg_policies
    where schemaname='public' and tablename='brand_members'
  loop
    execute format('drop policy if exists %I on public.brand_members', p_name);
  end loop;
end $$;

create policy "members: self select"  on public.brand_members for select
  using (auth.uid() = user_id);
create policy "members: owner select" on public.brand_members for select
  using (public.user_owns_brand(brand_id));
create policy "members: owner insert" on public.brand_members for insert
  with check (
    public.user_owns_brand(brand_id)
    and role in ('admin','editor','viewer')
    -- Don't let the owner add themselves as a member (their owner status is
    -- already implicit and a member row with conflicting role would confuse perms).
    and user_id <> (select owner_id from public.brands where id = brand_id)
  );
create policy "members: owner update" on public.brand_members for update
  using (public.user_owns_brand(brand_id))
  with check (public.user_owns_brand(brand_id) and role in ('admin','editor','viewer'));
create policy "members: owner delete" on public.brand_members for delete
  using (public.user_owns_brand(brand_id));

-- ─────────────────────────────────────────────────────────────
-- supabase/migrations/0010_security_round2.sql
-- ─────────────────────────────────────────────────────────────
-- Security round 2:
--  • Bind Figma OAuth refresh tokens to a Supabase user (no more cross-user
--    cookie inheritance on shared machines).
--  • Add ci_tokens: long-lived opaque tokens that map to a user for the CI
--    runner, replacing the practice of pasting short-lived Supabase JWTs
--    (or worse, service_role keys) into GitHub Secrets.
--  • Drop the misleading tracked_repos.pat_encrypted column — we never wrote
--    to it. PATs are request-scoped only.

-- ─── figma_user_tokens ──────────────────────────────────────────────────────
create table if not exists public.figma_user_tokens (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  refresh_token_enc    text not null,            -- AES-256-GCM ciphertext (base64)
  access_token_enc     text,                     -- short-TTL cache; nullable
  access_expires_at    timestamptz,
  figma_user_id        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.figma_user_tokens enable row level security;

create policy "figma_user_tokens: self read"   on public.figma_user_tokens for select
  using (auth.uid() = user_id);
create policy "figma_user_tokens: self upsert" on public.figma_user_tokens for insert
  with check (auth.uid() = user_id);
create policy "figma_user_tokens: self update" on public.figma_user_tokens for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "figma_user_tokens: self delete" on public.figma_user_tokens for delete
  using (auth.uid() = user_id);

-- ─── ci_tokens ──────────────────────────────────────────────────────────────
create table if not exists public.ci_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- We store ONLY a SHA-256 hash of the secret. The plaintext is shown to
  -- the user exactly once at creation time and never persisted.
  token_hash    text not null unique,
  label         text not null,
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists ci_tokens_user_idx on public.ci_tokens (user_id);

alter table public.ci_tokens enable row level security;

create policy "ci_tokens: self read"   on public.ci_tokens for select
  using (auth.uid() = user_id);
create policy "ci_tokens: self insert" on public.ci_tokens for insert
  with check (auth.uid() = user_id);
create policy "ci_tokens: self update" on public.ci_tokens for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ci_tokens: self delete" on public.ci_tokens for delete
  using (auth.uid() = user_id);

-- ─── Drop misleading pat_encrypted column ───────────────────────────────────
alter table public.tracked_repos drop column if exists pat_encrypted;

-- ─── Resolve CI tokens to user_id (SECURITY DEFINER so the unauthenticated
--     CI request can look up its owner before we switch into their context).
create or replace function public.resolve_ci_token(token_hash text)
returns uuid
language sql security definer stable
set search_path = public, pg_temp
as $$
  select user_id
  from public.ci_tokens
  where ci_tokens.token_hash = $1 and revoked_at is null
$$;

revoke all on function public.resolve_ci_token(text) from public;
-- We expose it through the API route which calls it via the service-role
-- client; no direct grant to anon/authenticated needed.
