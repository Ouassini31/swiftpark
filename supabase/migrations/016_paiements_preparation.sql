-- Paiements, étape 1 sur 2 (30/10/2026) : ce qui peut s'appliquer avant le déploiement du site.
-- Le chemin serveur reste fermé jusqu'à 017 : annuler_echange et valider_position refusent donc tout
-- mouvement de pièces qui passe par lui tant que 017 n'est pas appliquée.
-- Retour : 016_paiements_preparation_retour.sql

-- Les pièces offertes se suivent à part : même payées à un autre compte, elles restent non retirables.
alter table public.profiles add column offert_balance integer not null default 0;

-- Les soldes existants passent à la nouvelle règle : seul ce qui a été gagné auprès d'un autre compte se retire.
update public.coin_transactions set is_withdrawable = false
 where type = 'earn' and reservation_id is null and description like 'Achat pack%';
update public.coin_transactions t set is_withdrawable = false
  from public.reservations r
 where r.id = t.reservation_id and t.type = 'earn' and r.finder_id = r.sharer_id;
update public.coin_transactions
   set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('non_retirable', -amount)
 where type = 'spend' and reservation_id is not null;
update public.profiles p
   set bonus_balance = p.coin_balance - least(p.coin_balance, coalesce((
         select sum(t.amount)::integer from public.coin_transactions t
          where t.user_id = p.id and t.type = 'earn' and t.reservation_id is not null and t.is_withdrawable), 0));
update public.profiles set offert_balance = least(5, bonus_balance);

-- Les échanges de mai seront remboursés au premier passage de expirer_echanges : sans notification.
update public.reservations set finder_notified_at = now()
 where status = 'reserved' and expires_at < now() and finder_notified_at is null;

-- Les pièces offertes et la note ne s'écrivent plus depuis un compte, pas plus que le solde.
create or replace function public.profiles_argent_protege() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated')
     and ((tg_op = 'INSERT'
           and (new.coin_balance, new.bonus_balance, new.offert_balance, new.coins_earned, new.coins_spent,
                new.stripe_customer_id, new.stripe_connect_account_id,
                new.stripe_connect_payouts_enabled, new.stripe_connect_iban_last4,
                new.rating, new.rating_count)
               is distinct from (0, 0, 0, 0, 0, null, null, false, null, null, 0))
       or (tg_op = 'UPDATE'
           and (new.coin_balance, new.bonus_balance, new.offert_balance, new.coins_earned, new.coins_spent,
                new.stripe_customer_id, new.stripe_connect_account_id,
                new.stripe_connect_payouts_enabled, new.stripe_connect_iban_last4,
                new.rating, new.rating_count)
               is distinct from
               (old.coin_balance, old.bonus_balance, old.offert_balance, old.coins_earned, old.coins_spent,
                old.stripe_customer_id, old.stripe_connect_account_id,
                old.stripe_connect_payouts_enabled, old.stripe_connect_iban_last4,
                old.rating, old.rating_count))) then
    raise exception 'solde non modifiable' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function public.give_welcome_bonus() returns trigger
  language plpgsql security definer set search_path to 'public', 'pg_catalog' as $function$
declare v_new_balance integer;
begin
  if exists (select 1 from public.coin_transactions where user_id = new.id and type = 'bonus') then
    return new;
  end if;

  update public.profiles
     set coin_balance   = coin_balance + 5,
         bonus_balance  = bonus_balance + 5,
         offert_balance = offert_balance + 5,
         coins_earned   = coins_earned + 5
   where id = new.id
   returning coin_balance into v_new_balance;

  insert into public.coin_transactions
     (user_id, type, status, amount, balance_after, description, metadata, is_withdrawable)
  values
     (new.id, 'bonus', 'completed', 5, v_new_balance,
      '🎁 Bienvenue sur SwiftPark — 5 SwiftCoins offerts !', '{}'::jsonb, false);

  return new;
end;
$function$;

-- Même calcul que l'écran de retrait : le solde moins ce qui ne se retire pas.
create or replace function public.get_withdrawable_balance(p_user_id uuid) returns integer
  language sql stable security definer set search_path to 'public', 'pg_catalog' as $function$
  select coalesce((select greatest(0, coin_balance - bonus_balance) from public.profiles where id = p_user_id), 0)::integer;
$function$;

-- Nom, note et véhicule d'un autre conducteur, sans plaque ni téléphone, depuis que profiles est privé (014) :
-- ceux qui proposent une place, ou l'autre partie d'un échange.
create function public.profils_publics(p_ids uuid[])
  returns table (id uuid, username text, full_name text, avatar_url text, rating numeric, rating_count integer,
                 spots_shared integer, vehicle_make text, vehicle_model text, vehicle_color text,
                 vehicle_length_cm integer, vehicle_category text)
  language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.full_name, p.avatar_url, p.rating, p.rating_count, p.spots_shared,
         p.vehicle_make, p.vehicle_model, p.vehicle_color, p.vehicle_length_cm, p.vehicle_category
    from public.profiles p
   where p.id = any(p_ids)
     and (exists (select 1 from public.parking_spots s where s.sharer_id = p.id and s.status in ('available', 'reserved'))
       or exists (select 1 from public.reservations r
                   where (r.finder_id = auth.uid() and r.sharer_id = p.id)
                      or (r.sharer_id = auth.uid() and r.finder_id = p.id)));
$$;
revoke all on function public.profils_publics(uuid[]) from public, anon;
grant execute on function public.profils_publics(uuid[]) to authenticated, service_role;

-- L'admin voit les demandes de retrait et peut retirer une place de la carte ; ses écrans échouaient en silence.
create policy "withdrawals: select admin" on public.withdrawal_requests
  for select to authenticated using (public.est_admin());
create policy "spots: update admin" on public.parking_spots
  for update to authenticated using (public.est_admin());

-- Une commande se crée en attente et seul le serveur la marque payée.
drop policy stripe_orders_own on public.stripe_orders;
create policy stripe_orders_insert_own on public.stripe_orders
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');

-- On ne note que l'autre partie d'un échange terminé.
drop policy ratings_insert_auth on public.ratings;
drop policy ratings_insert_own on public.ratings;
create policy ratings_insert_partie on public.ratings
  for insert to authenticated with check (
    auth.uid() = rater_id
    and exists (select 1 from public.reservations r
                 where r.id = reservation_id and r.status = 'completed'
                   and ((r.finder_id = rater_id and r.sharer_id = rated_id)
                     or (r.sharer_id = rater_id and r.finder_id = rated_id))));
-- La moyenne s'écrit sur le profil de l'autre : le déclencheur doit pouvoir passer la sécurité par ligne.
alter function public.update_rating() security definer;

-- Stripe peut renvoyer le même événement : un paiement ne se crédite qu'une fois.
create unique index coin_transactions_stripe_session_unique on public.coin_transactions ((metadata->>'stripe_session_id'))
  where metadata ? 'stripe_session_id';
create unique index coin_transactions_stripe_intent_unique on public.coin_transactions ((metadata->>'stripe_payment_intent_id'))
  where metadata ? 'stripe_payment_intent_id';

-- Annule un échange en cours et rembourse le chercheur s'il a payé ; la place revient alors sur la carte.
-- Renvoie le montant remboursé, ou null si l'échange n'était plus en cours.
create function public.annuler_echange(p_reservation_id uuid, p_taux numeric, p_raison text, p_description text)
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
revoke all on function public.annuler_echange(uuid, numeric, text, text) from public, anon, authenticated;
grant execute on function public.annuler_echange(uuid, numeric, text, text) to service_role;

-- Un conducteur valide sa position. Quand les deux l'ont fait, l'échange se termine et le partageur est payé.
-- Le chercheur ne peut pas écrire sur la place : sans cette fonction, sa validation se perdait.
create function public.valider_position(p_reservation_id uuid, p_lat double precision, p_lng double precision)
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
revoke all on function public.valider_position(uuid, double precision, double precision) from public, anon;
grant execute on function public.valider_position(uuid, double precision, double precision) to authenticated, service_role;
