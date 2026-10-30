-- Retour de 014 : rouvre la lecture de toute la table, donc la fuite. À n'utiliser qu'en cas de panne.

create or replace view public.top_sharers with (security_invoker = on) as
  select id, username, full_name, spots_shared, coins_earned, rating, rating_count
  from public.profiles p where spots_shared > 0 order by coins_earned desc limit 100;
create or replace view public.top_finders with (security_invoker = on) as
  select id, username, full_name, spots_found, coins_spent, rating, rating_count
  from public.profiles p where spots_found > 0 order by spots_found desc limit 100;
drop function public.classement_partageurs();
drop function public.classement_chercheurs();

drop policy "profiles: select admin" on public.profiles;
create policy "profiles: select others basic" on public.profiles for select using (true);
create policy profiles_select_all on public.profiles for select using (true);
create policy profiles_select_public on public.profiles for select using (true);

drop trigger profiles_role_protege on public.profiles;
drop function public.profiles_role_protege();
drop function public.est_admin();
