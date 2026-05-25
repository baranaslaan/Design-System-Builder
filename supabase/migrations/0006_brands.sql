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
