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
