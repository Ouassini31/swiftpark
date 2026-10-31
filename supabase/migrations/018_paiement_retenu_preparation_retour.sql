-- Retour de 018_paiement_retenu_preparation.sql. À jouer APRÈS 019_paiement_retenu_verrou_retour.sql.

create or replace function public.expirer_echanges() returns integer
  language plpgsql security definer set search_path = '' as $$
declare v_id uuid; n integer := 0;
begin
  -- Le cron n'a pas de session : il agit comme le serveur, le temps de cette fonction.
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  for v_id in select r.id from public.reservations r where r.status = 'reserved' and r.expires_at < now() loop
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

drop function public.declarer_place_occupee(uuid, double precision, double precision);

create or replace function public.valider_position(p_reservation_id uuid, p_lat double precision, p_lng double precision)
  returns boolean language plpgsql security definer set search_path = '' as $$
declare v_resa public.reservations; v_partageur boolean; v_fini boolean;
begin
  select * into v_resa from public.reservations where id = p_reservation_id for update;
  if not found or auth.uid() is null or auth.uid() not in (v_resa.finder_id, v_resa.sharer_id) then
    raise exception 'Échange introuvable' using errcode = '42501';
  end if;
  if v_resa.status <> 'reserved' then return false; end if;
  if v_resa.expires_at < now() then raise exception 'Échange expiré'; end if;

  v_partageur := auth.uid() = v_resa.sharer_id;
  update public.parking_spots s set
    sharer_validated = coalesce(s.sharer_validated, false) or v_partageur,
    sharer_gps_lat   = case when v_partageur then p_lat else s.sharer_gps_lat end,
    sharer_gps_lng   = case when v_partageur then p_lng else s.sharer_gps_lng end,
    finder_validated = coalesce(s.finder_validated, false) or not v_partageur,
    finder_gps_lat   = case when v_partageur then s.finder_gps_lat else p_lat end,
    finder_gps_lng   = case when v_partageur then s.finder_gps_lng else p_lng end
   where s.id = v_resa.spot_id
  returning s.sharer_validated and s.finder_validated into v_fini;
  if not coalesce(v_fini, false) then return false; end if;

  update public.reservations set status = 'completed', completed_at = now() where id = v_resa.id;
  update public.parking_spots set status = 'completed', validation_status = 'validated', validated_at = now()
   where id = v_resa.spot_id;
  perform public.process_coin_transaction(v_resa.sharer_id, v_resa.sharer_receive, 'earn',
    format('Départ signalé — %s SC', v_resa.sharer_receive), v_resa.id);
  return true;
end $$;

drop function public.terminer_echange(uuid);

create or replace function public.annuler_echange(p_reservation_id uuid, p_taux numeric, p_raison text, p_description text)
  returns integer language plpgsql security definer set search_path = '' as $$
declare v_resa public.reservations; v_rembourse integer := 0;
begin
  update public.reservations
     set status = 'cancelled', cancelled_at = now(), cancel_reason = p_raison
   where id = p_reservation_id and status = 'reserved'
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

drop index public.reservations_une_en_cours;
alter table public.reservations drop column depart_signale_at, drop column paiement_prevu_at;
