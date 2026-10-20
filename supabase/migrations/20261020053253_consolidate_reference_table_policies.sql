drop policy "games visible to owner or everyone" on public.games;
drop policy "games owner write" on public.games;
drop policy "categories owner or system" on public.transaction_categories;
drop policy "categories owner write" on public.transaction_categories;

create policy "games select" on public.games for select to authenticated using (owner_id is null or (select auth.uid()) = owner_id);
create policy "games insert" on public.games for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "games update" on public.games for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "games delete" on public.games for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "categories select" on public.transaction_categories for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
create policy "categories insert" on public.transaction_categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categories update" on public.transaction_categories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories delete" on public.transaction_categories for delete to authenticated using ((select auth.uid()) = user_id);
