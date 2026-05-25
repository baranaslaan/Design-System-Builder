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
