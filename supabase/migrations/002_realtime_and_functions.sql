-- ============================================================
-- SwiftPark — Migration 002 : Realtime + fonctions utilitaires
-- ============================================================

-- Activer Realtime sur les tables critiques
alter publication supabase_realtime add table public.parking_spots;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.profiles;

-- ============================================================
-- Fonction : places à proximité (utilise PostGIS)
-- ============================================================
create or replace function public.get_nearby_spots(
  p_lat    double precision,
  p_lng    double precision,
  p_radius double precision default 2000  -- mètres
)
returns setof public.parking_spots
language sql stable as $$
  select *
  from public.parking_spots
  where status = 'available'
    and expires_at > now()
    and st_dwithin(
      location::geography,
      st_point(p_lng, p_lat)::geography,
      p_radius
    )
  order by
    st_distance(location::geography, st_point(p_lng, p_lat)::geography) asc;
$$;

-- ============================================================
-- Fonction : annuler une réservation expirée
-- ============================================================
create or replace function public.cancel_expired_reservations()
returns void language plpgsql as $$
begin
  -- Rembourser + annuler les réservations expirées
  with expired as (
    update public.reservations
    set status = 'cancelled', cancelled_at = now(), cancel_reason = 'expired'
    where status = 'reserved' and expires_at < now()
    returning id, finder_id, spot_id, coin_amount
  )
  update public.parking_spots
  set status = 'available'
  where id in (select spot_id from expired);

  -- Remboursement SwiftCoins (rpc dans Edge Function)
end;
$$;

-- ============================================================
-- Notification automatique à la réservation
-- ============================================================
create or replace function public.notify_on_reservation()
returns trigger language plpgsql security definer as $$
begin
  -- Notifier le sharer
  insert into public.notifications (user_id, reservation_id, type, title, body)
  values (
    new.sharer_id,
    new.id,
    'reservation_received',
    '👀 Ton info a été achetée !',
    'Un conducteur se dirige vers toi. Prépare-toi à partir.'
  );

  -- Notifier le finder
  insert into public.notifications (user_id, reservation_id, type, title, body)
  values (
    new.finder_id,
    new.id,
    'reservation_confirmed',
    '✅ Info confirmée !',
    'Dirige-toi vers la place et valide ton arrivée GPS.'
  );

  return new;
end;
$$;

create trigger on_reservation_created
  after insert on public.reservations
  for each row execute function public.notify_on_reservation();

-- ============================================================
-- Mise à jour du rating moyen après chaque note
-- ============================================================
create or replace function public.update_rating()
returns trigger language plpgsql as $$
begin
  update public.profiles
  set
    rating = (
      select avg(score)::numeric(3,2)
      from public.ratings
      where rated_id = new.rated_id
    ),
    rating_count = (
      select count(*)
      from public.ratings
      where rated_id = new.rated_id
    )
  where id = new.rated_id;

  return new;
end;
$$;

create trigger on_rating_created
  after insert on public.ratings
  for each row execute function public.update_rating();

-- ============================================================
-- Bonus de bienvenue (50 SC à l'inscription)
-- ============================================================
create or replace function public.give_welcome_bonus()
returns trigger language plpgsql security definer as $$
begin
  perform public.process_coin_transaction(
    new.id,
    50,
    'bonus',
    '🎁 Bienvenue sur SwiftPark — 50 SwiftCoins offerts !'
  );
  return new;
end;
$$;

create trigger on_profile_created_bonus
  after insert on public.profiles
  for each row execute function public.give_welcome_bonus();
