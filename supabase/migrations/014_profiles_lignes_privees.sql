-- Profils : chacun ne lit plus que sa propre ligne (30/10/2026).
-- Trois politiques « using (true) » laissaient lire toute la table avec la clé publique, même sans compte :
-- plaque (012 la disait « jamais visible »), téléphone, identifiants Stripe, soldes, position préférée.
-- L'app TestFlight lit son profil en select("*") : retirer le droit sur une colonne la casserait,
-- d'où un filtre par ligne. Retour : 014_profiles_lignes_privees_retour.sql

create function public.est_admin() returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- Sans ça, la lecture admin se contourne : chacun peut modifier sa ligne, donc se nommer admin.
create function public.profiles_role_protege() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated')
     and ((tg_op = 'INSERT' and new.role is distinct from 'driver'::public.user_role)
       or (tg_op = 'UPDATE' and new.role is distinct from old.role)) then
    raise exception 'role non modifiable' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public.profiles_role_protege() from public, anon, authenticated;
create trigger profiles_role_protege before insert or update on public.profiles
  for each row execute function public.profiles_role_protege();

drop policy "profiles: select others basic" on public.profiles;
drop policy profiles_select_all on public.profiles;
drop policy profiles_select_public on public.profiles;
create policy "profiles: select admin" on public.profiles
  for select to authenticated using (public.est_admin());

-- Classements : mêmes colonnes qu'avant, lues hors filtre par une fonction qui n'en renvoie pas d'autres.
create function public.classement_partageurs()
  returns table (id uuid, username text, full_name text, spots_shared integer, coins_earned integer, rating numeric, rating_count integer)
  language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.full_name, p.spots_shared, p.coins_earned, p.rating, p.rating_count
  from public.profiles p where p.spots_shared > 0 order by p.coins_earned desc limit 100;
$$;
create function public.classement_chercheurs()
  returns table (id uuid, username text, full_name text, spots_found integer, coins_spent integer, rating numeric, rating_count integer)
  language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.full_name, p.spots_found, p.coins_spent, p.rating, p.rating_count
  from public.profiles p where p.spots_found > 0 order by p.spots_found desc limit 100;
$$;
revoke all on function public.classement_partageurs() from public, anon;
revoke all on function public.classement_chercheurs() from public, anon;
grant execute on function public.classement_partageurs() to authenticated;
grant execute on function public.classement_chercheurs() to authenticated;

create or replace view public.top_sharers with (security_invoker = on) as
  select id, username, full_name, spots_shared, coins_earned, rating::numeric(3,2) as rating, rating_count
  from public.classement_partageurs();
create or replace view public.top_finders with (security_invoker = on) as
  select id, username, full_name, spots_found, coins_spent, rating::numeric(3,2) as rating, rating_count
  from public.classement_chercheurs();
