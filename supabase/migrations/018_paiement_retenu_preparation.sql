-- Paiement retenu, étape 1 sur 2 (31/10/2026) : ce qui peut s'appliquer avant le déploiement du site.
-- Signaler son départ payait tout de suite : on pouvait encaisser sans bouger sa voiture, sans remboursement possible.
-- Le partageur est maintenant payé au terme d'un délai, sauf si le chercheur déclare la place occupée.
-- Retour : 018_paiement_retenu_preparation_retour.sql

alter table public.reservations
  add column depart_signale_at timestamptz,
  add column paiement_prevu_at timestamptz;

-- Une place n'a qu'un échange en cours : le départ du partageur tombe sur le bon.
create unique index reservations_une_en_cours on public.reservations (spot_id) where status = 'reserved';

-- Une fois le départ signalé, le chercheur ne peut plus annuler : il déclare la place occupée, ou le partageur est payé.
create or replace function public.annuler_echange(p_reservation_id uuid, p_taux numeric, p_raison text, p_description text)
  returns integer language plpgsql security definer set search_path = '' as $$
declare v_resa public.reservations; v_rembourse integer := 0;
begin
  update public.reservations
     set status = 'cancelled', cancelled_at = now(), cancel_reason = p_raison
   where id = p_reservation_id and status = 'reserved'
     and not (depart_signale_at is not null and p_raison = 'cancelled_by_finder')
  returning * into v_resa;
  if not found then return null; end if;

  if exists (select 1 from public.coin_transactions t
              where t.reservation_id = v_resa.id and t.user_id = v_resa.finder_id
                and t.type = 'spend' and t.amount = -v_resa.coin_amount) then
    v_rembourse := round(v_resa.coin_amount * p_taux);
    if v_rembourse > 0 then
      perform public.process_coin_transaction(v_resa.finder_id, v_rembourse, 'refund', p_description, v_resa.id);
    end if;
    update public.parking_spots s
       set status = case when s.expires_at > now() then 'available' else 'expired' end::public.spot_status,
           finder_validated = false, finder_gps_lat = null, finder_gps_lng = null
     where s.id = v_resa.spot_id and s.status = 'reserved';
  else
    -- Rien n'a été payé : pas de « tes pièces sont remboursées » à envoyer.
    update public.reservations set finder_notified_at = now() where id = v_resa.id;
  end if;
  return v_rembourse;
end $$;

-- Termine un échange et paie le partageur, une seule fois. Aucun compte ne peut l'appeler directement.
create function public.terminer_echange(p_reservation_id uuid)
  returns boolean language plpgsql security definer set search_path = '' as $$
declare v_resa public.reservations; v_session text := current_setting('request.jwt.claims', true);
begin
  select * into v_resa from public.reservations where id = p_reservation_id and status = 'reserved' for update;
  if not found then return false; end if;

  -- Sans paiement du chercheur, il n'y a rien à verser.
  if not exists (select 1 from public.coin_transactions t
                  where t.reservation_id = v_resa.id and t.user_id = v_resa.finder_id
                    and t.type = 'spend' and t.amount = -v_resa.coin_amount) then
    perform public.annuler_echange(v_resa.id, 1, 'non_paye', '');
    return false;
  end if;

  update public.reservations set status = 'completed', completed_at = now() where id = v_resa.id;
  update public.parking_spots set status = 'completed', validation_status = 'validated', validated_at = now()
   where id = v_resa.spot_id;

  -- Le versement passe par le rôle serveur, le temps de cette écriture.
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform public.process_coin_transaction(v_resa.sharer_id, v_resa.sharer_receive, 'earn',
    format('Départ signalé — %s SC', v_resa.sharer_receive), v_resa.id);
  perform set_config('request.jwt.claims', coalesce(v_session, ''), true);

  insert into public.notifications (user_id, reservation_id, type, title, body, data)
  values (v_resa.sharer_id, v_resa.id, 'payment_received', format('✅ +%s SC reçus !', v_resa.sharer_receive),
          'Tes SwiftCoins sont crédités.', '{"url":"/wallet"}');
  return true;
end $$;
revoke all on function public.terminer_echange(uuid) from public, anon, authenticated, service_role;

-- Le partageur signale son départ : sa place est finie et le paiement est prévu au terme du délai. Le chercheur garde
-- au moins 5 minutes, et tout le temps prévu pour arriver. Sa validation ne paie tout de suite que si elle vient APRÈS
-- le départ signalé : avant, elle dit seulement qu'il est arrivé, pas que la place est libre.
create or replace function public.valider_position(p_reservation_id uuid, p_lat double precision, p_lng double precision)
  returns boolean language plpgsql security definer set search_path = '' as $$
declare v_resa public.reservations; v_partageur boolean;
begin
  select * into v_resa from public.reservations where id = p_reservation_id for update;
  if not found or auth.uid() is null or auth.uid() not in (v_resa.finder_id, v_resa.sharer_id) then
    raise exception 'Échange introuvable' using errcode = '42501';
  end if;
  if v_resa.status <> 'reserved' then return false; end if;
  if v_resa.depart_signale_at is null and v_resa.expires_at < now() then raise exception 'Échange expiré'; end if;

  v_partageur := auth.uid() = v_resa.sharer_id;
  update public.parking_spots s set
    sharer_validated = coalesce(s.sharer_validated, false) or v_partageur,
    sharer_confirmed = s.sharer_confirmed or v_partageur,
    sharer_gps_lat   = case when v_partageur then p_lat else s.sharer_gps_lat end,
    sharer_gps_lng   = case when v_partageur then p_lng else s.sharer_gps_lng end,
    finder_validated = coalesce(s.finder_validated, false) or not v_partageur,
    finder_gps_lat   = case when v_partageur then s.finder_gps_lat else p_lat end,
    finder_gps_lng   = case when v_partageur then s.finder_gps_lng else p_lng end
   where s.id = v_resa.spot_id;

  if v_partageur then
    if v_resa.depart_signale_at is null then
      update public.reservations
         set depart_signale_at = now(), paiement_prevu_at = greatest(now() + interval '5 minutes', expires_at)
       where id = v_resa.id;
      update public.parking_spots set status = 'completed' where id = v_resa.spot_id;
      -- Écrite ici : le chercheur doit savoir que le délai court, quoi que fasse l'écran du partageur.
      insert into public.notifications (user_id, reservation_id, type, title, body, data)
      values (v_resa.finder_id, v_resa.id, 'spot_validated', '🏃 Il part maintenant !',
              'La place se libère. Si elle est occupée à ton arrivée, déclare-le dans tes échanges : tu seras remboursé.',
              '{"url":"/reservations"}');
    end if;
    return false;
  end if;

  if v_resa.depart_signale_at is null then return false; end if;
  return public.terminer_echange(v_resa.id);
end $$;

-- Le chercheur arrive et la place n'est pas libre : remboursé en entier, le partageur n'est pas payé.
-- Il doit être venu sur place (150 m, tolérance GPS en ville), et trois déclarations par 30 jours limitent les abus.
create function public.declarer_place_occupee(p_reservation_id uuid, p_lat double precision, p_lng double precision)
  returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_resa public.reservations; v_spot public.parking_spots; v_rembourse integer;
  v_session text := current_setting('request.jwt.claims', true);
begin
  select * into v_resa from public.reservations where id = p_reservation_id for update;
  if not found or auth.uid() is null or auth.uid() <> v_resa.finder_id then
    raise exception 'Échange introuvable' using errcode = '42501';
  end if;
  if v_resa.status <> 'reserved' or v_resa.depart_signale_at is null or v_resa.paiement_prevu_at < now() then
    raise exception 'Cet échange ne peut plus être déclaré occupé';
  end if;

  select * into v_spot from public.parking_spots where id = v_resa.spot_id;
  if not coalesce(public.st_distancesphere(public.st_makepoint(p_lng, p_lat),
                                           public.st_makepoint(v_spot.lng, v_spot.lat)) <= 150, false) then
    raise exception 'Tu es trop loin de la place pour la déclarer occupée';
  end if;

  if (select count(*) from public.reservations r
       where r.finder_id = v_resa.finder_id and r.cancel_reason = 'place_occupee'
         and r.cancelled_at > now() - interval '30 days') >= 3 then
    raise exception 'Tu as déjà déclaré trois places occupées en 30 jours : cet échange suit son cours';
  end if;

  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  v_rembourse := public.annuler_echange(v_resa.id, 1, 'place_occupee', '↩️ Remboursement — place déclarée occupée');
  perform set_config('request.jwt.claims', coalesce(v_session, ''), true);

  -- Le partageur a dit partir : la place ne revient pas sur la carte.
  update public.parking_spots set status = 'cancelled', cancelled_at = now(), cancel_reason = 'place_occupee'
   where id = v_resa.spot_id;

  insert into public.notifications (user_id, reservation_id, type, title, body, data)
  values (v_resa.sharer_id, v_resa.id, 'reservation_cancelled', '❌ Place déclarée occupée',
          'Le conducteur a trouvé la place occupée. L''échange est annulé, sans paiement.', '{"url":"/reservations"}');
  return v_rembourse;
end $$;
revoke all on function public.declarer_place_occupee(uuid, double precision, double precision) from public, anon;
grant execute on function public.declarer_place_occupee(uuid, double precision, double precision) to authenticated, service_role;

-- Chaque minute : paie les départs signalés dont le délai est passé, rembourse les échanges sans départ.
-- Un échange jamais payé ne bloque pas la place plus de 2 minutes.
create or replace function public.expirer_echanges() returns integer
  language plpgsql security definer set search_path = '' as $$
declare v_id uuid; n integer := 0;
begin
  -- Le cron n'a pas de session : il agit comme le serveur, le temps de cette fonction.
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  for v_id in select r.id from public.reservations r
               where r.status = 'reserved' and r.depart_signale_at is not null and r.paiement_prevu_at <= now() loop
    begin
      perform public.terminer_echange(v_id);
      n := n + 1;
    exception when others then
      raise warning 'expirer_echanges %: %', v_id, sqlerrm;
    end;
  end loop;
  for v_id in select r.id from public.reservations r
               where r.status = 'reserved' and r.depart_signale_at is null
                 and (r.expires_at < now()
                      or (r.reserved_at < now() - interval '2 minutes'
                          and not exists (select 1 from public.coin_transactions t
                                           where t.reservation_id = r.id and t.type = 'spend'))) loop
    begin
      perform public.annuler_echange(v_id, 1, 'timeout', '↩️ Remboursement — réservation expirée');
      n := n + 1;
    exception when others then
      raise warning 'expirer_echanges %: %', v_id, sqlerrm;
    end;
  end loop;
  update public.parking_spots s set status = 'expired'
   where s.status in ('available', 'reserved') and s.expires_at < now()
     and not exists (select 1 from public.reservations r where r.spot_id = s.id and r.status = 'reserved');
  perform set_config('request.jwt.claims', '', true);
  return n;
end $$;
