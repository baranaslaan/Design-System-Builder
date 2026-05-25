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
