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
