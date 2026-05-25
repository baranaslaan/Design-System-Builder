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
