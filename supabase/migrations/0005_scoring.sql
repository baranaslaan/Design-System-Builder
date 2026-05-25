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
