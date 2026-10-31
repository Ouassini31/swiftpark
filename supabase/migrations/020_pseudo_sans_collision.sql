-- Deux adresses peuvent commencer pareil (jean@gmail.com, jean@yahoo.fr), et deux personnes
-- peuvent choisir le même pseudo : l'index unique faisait alors échouer la création du compte
-- (« Database error saving new user »). Le pseudo ne doit jamais empêcher de s'inscrire.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  base text := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'membre'
  );
  choisi text := base;
begin
  while exists (select 1 from public.profiles where username = choisi) loop
    choisi := base || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url, referral_code)
  values (
    new.id,
    choisi,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'SWIFT-' || upper(substring(md5(new.id::text) from 1 for 6))
  );
  return new;
end;
$function$;
