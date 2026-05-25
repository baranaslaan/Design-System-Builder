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
