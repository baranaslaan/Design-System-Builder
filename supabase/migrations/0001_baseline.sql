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
