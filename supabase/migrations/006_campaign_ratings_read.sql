-- The original policies on `campaign_ratings` only let each side touch their
-- own rater_role rows. To compute the brand trust score we need the brand to
-- READ the influencer-side rating (where rater_role='influencer') of their
-- own campaigns. Same goes for influencers reading the brand-side rating they
-- received. Writes stay scoped — only the right role can insert/update.

drop policy if exists "influencer_rate_own" on public.campaign_ratings;
drop policy if exists "brand_rate_own" on public.campaign_ratings;

-- Reads: each side can see ratings where they were the target/owner.
create policy "ratings_read_own_brand"
  on public.campaign_ratings
  for select
  using (auth.uid() = brand_id);

create policy "ratings_read_own_influencer"
  on public.campaign_ratings
  for select
  using (auth.uid() = influencer_id);

-- Writes: each side can only insert/update/delete their own role's row.
create policy "ratings_write_own_brand"
  on public.campaign_ratings
  for insert
  with check (auth.uid() = brand_id and rater_role = 'brand');

create policy "ratings_update_own_brand"
  on public.campaign_ratings
  for update
  using (auth.uid() = brand_id and rater_role = 'brand')
  with check (auth.uid() = brand_id and rater_role = 'brand');

create policy "ratings_delete_own_brand"
  on public.campaign_ratings
  for delete
  using (auth.uid() = brand_id and rater_role = 'brand');

create policy "ratings_write_own_influencer"
  on public.campaign_ratings
  for insert
  with check (auth.uid() = influencer_id and rater_role = 'influencer');

create policy "ratings_update_own_influencer"
  on public.campaign_ratings
  for update
  using (auth.uid() = influencer_id and rater_role = 'influencer')
  with check (auth.uid() = influencer_id and rater_role = 'influencer');

create policy "ratings_delete_own_influencer"
  on public.campaign_ratings
  for delete
  using (auth.uid() = influencer_id and rater_role = 'influencer');
