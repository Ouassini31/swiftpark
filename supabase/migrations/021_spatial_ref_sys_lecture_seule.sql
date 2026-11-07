-- L'alerte rls_disabled_in_public vise public.spatial_ref_sys, la table des systèmes de
-- coordonnées de PostGIS. Elle appartient à supabase_admin : postgres ne peut ni y activer
-- RLS (42501 « must be owner ») ni retirer les droits d'écriture qu'anon et authenticated
-- y ont reçus de supabase_admin. Un visiteur sans compte pouvait donc, par l'API, modifier
-- ou effacer la ligne 4326 dont dépendent tous les calculs de distance (dl_*).
--
-- Ce verrou refuse toute écriture (ajout, modification, suppression, vidage) venant
-- d'anon et d'authenticated, et d'eux seuls. La lecture reste ouverte. Les rôles internes
-- (supabase_admin pour les mises à jour de PostGIS et la maintenance, postgres,
-- service_role) écrivent comme avant.
--
-- L'alerte restera affichée dans les advisors : seul Supabase peut activer RLS ici.
--
-- current_user et non session_user : PostgREST se connecte en authenticator puis prend le
-- rôle anon ou authenticated. La fonction est security invoker, sinon current_user serait
-- son propriétaire et le verrou ne verrait jamais le rôle de l'appelant.

create or replace function public.spatial_ref_sys_lecture_seule()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'spatial_ref_sys est en lecture seule'
      using errcode = '42501';
  end if;
  if tg_level = 'STATEMENT' then
    return null;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

-- Un déclencheur s'exécute sans vérifier ce droit : le retirer n'ôte rien au verrou et
-- empêche d'appeler la fonction par l'API.
revoke all on function public.spatial_ref_sys_lecture_seule() from public, anon, authenticated;

create trigger spatial_ref_sys_lecture_seule_lignes
  before insert or update or delete on public.spatial_ref_sys
  for each row execute function public.spatial_ref_sys_lecture_seule();

create trigger spatial_ref_sys_lecture_seule_vidage
  before truncate on public.spatial_ref_sys
  for each statement execute function public.spatial_ref_sys_lecture_seule();
