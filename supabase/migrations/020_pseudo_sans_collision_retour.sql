-- Retour de 020 : remet la fonction telle qu'elle était.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, referral_code)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'SWIFT-' || upper(substring(md5(new.id::text) from 1 for 6))
  );
  RETURN new;
END;
$function$;
