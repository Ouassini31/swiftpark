-- Paiement retenu, étape 2 sur 2 (31/10/2026) : s'applique APRÈS le déploiement du site, qui n'écrit plus le statut
-- d'une réservation et ne demande plus le paiement du partageur. Sans ce verrou, le délai se contourne depuis un compte.
-- Retour : 019_paiement_retenu_verrou_retour.sql

-- Depuis un compte : créer un échange, aux conditions normales, et abandonner celui qu'on n'a pas payé (paiement refusé).
-- Tout le reste passe par valider_position, declarer_place_occupee et le serveur.
create or replace function public.reservations_montants_proteges() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;

  if tg_op = 'INSERT' then
    new.status := 'reserved';
    new.reserved_at := now();
    new.expires_at := now() + interval '10 minutes';
    new.depart_signale_at := null;
    new.paiement_prevu_at := null;
    new.completed_at := null;
    new.cancelled_at := null;
    new.cancel_reason := null;
    return new;
  end if;

  if not (old.status = 'reserved' and new.status = 'cancelled' and auth.uid() = old.finder_id
          and not exists (select 1 from public.coin_transactions t
                           where t.reservation_id = old.id and t.user_id = old.finder_id and t.type = 'spend')
          and to_jsonb(new) - array['status', 'cancelled_at', 'cancel_reason', 'updated_at']
            = to_jsonb(old) - array['status', 'cancelled_at', 'cancel_reason', 'updated_at']) then
    raise exception 'reservation non modifiable' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger reservations_montants_proteges on public.reservations;
create trigger reservations_montants_proteges before insert or update on public.reservations
  for each row execute function public.reservations_montants_proteges();

-- Depuis un compte, un seul mouvement : payer une place encore libre. Le partageur est payé par terminer_echange.
-- Chaque mouvement suit ce qui ne se retire pas : une pièce offerte le reste même payée à un autre compte.
create or replace function public.process_coin_transaction(
  p_user_id uuid, p_amount integer, p_type public.transaction_type, p_description text,
  p_reservation_id uuid default null, p_metadata jsonb default '{}'::jsonb, p_is_withdrawable boolean default true
) returns uuid
  language plpgsql security definer set search_path to 'public', 'pg_catalog' as $function$
declare
  v_balance integer; v_bonus integer; v_offert integer; v_new_balance integer; v_tx_id uuid;
  v_resa public.reservations; v_paye jsonb; v_regle boolean;
  v_non_retirable integer := 0; v_offert_mvt integer := 0;
begin
  select * into v_resa from public.reservations where id = p_reservation_id for update;
  select coalesce(t.metadata, '{}'::jsonb) into v_paye from public.coin_transactions t
   where t.reservation_id = p_reservation_id and t.user_id = v_resa.finder_id
     and t.type = 'spend' and t.amount = -v_resa.coin_amount
   order by t.created_at limit 1;
  v_regle := exists (select 1 from public.coin_transactions t
                      where t.reservation_id = p_reservation_id and t.type in ('earn', 'refund'));

  if coalesce(auth.role(), '') <> 'service_role' then
    if not coalesce(p_type = 'spend'
        and auth.uid() = p_user_id and v_resa.finder_id = p_user_id and v_resa.sharer_id <> p_user_id
        and v_resa.status = 'reserved' and v_paye is null
        and p_amount < 0 and p_amount = -v_resa.coin_amount
        and v_resa.sharer_receive = v_resa.coin_amount - round(v_resa.coin_amount * 0.25)
        and exists (select 1 from public.parking_spots s
                    where s.id = v_resa.spot_id and s.sharer_id = v_resa.sharer_id and s.coin_price = v_resa.coin_amount),
      false) then
      raise exception 'Mouvement de pièces non autorisé' using errcode = '42501';
    end if;

    -- La place quitte la carte au paiement : deux conducteurs ne peuvent pas acheter la même.
    -- Le chercheur ne peut pas écrire sur la place, l'écriture de l'écran restait sans effet.
    update public.parking_spots set status = 'reserved'
     where id = v_resa.spot_id and status = 'available' and expires_at > now();
    if not found then
      raise exception 'Cette place n''est plus disponible' using errcode = '42501';
    end if;
  end if;

  if p_type = 'refund' and p_reservation_id is not null
     and not coalesce(p_user_id = v_resa.finder_id and v_paye is not null and not v_regle
                      and p_amount between 1 and v_resa.coin_amount, false) then
    raise exception 'Remboursement impossible pour cette réservation';
  end if;

  select coin_balance, bonus_balance, offert_balance into v_balance, v_bonus, v_offert
    from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profil introuvable'; end if;
  v_new_balance := v_balance + p_amount;
  if v_new_balance < 0 then raise exception 'Solde insuffisant'; end if;

  if p_amount < 0 then
    if p_type = 'withdraw' then
      if -p_amount > v_balance - v_bonus then raise exception 'Solde retirable insuffisant'; end if;
    else
      -- Une dépense consomme d'abord ce qui ne se retire pas
      v_non_retirable := least(v_bonus, -p_amount);
      v_offert_mvt := least(v_offert, -p_amount);
    end if;
  elsif p_type = 'bonus' then
    v_non_retirable := p_amount;
    v_offert_mvt := p_amount;
  elsif p_type = 'earn' and p_reservation_id is not null then
    v_offert_mvt := least(p_amount, coalesce((v_paye->>'offert')::integer, 0));
    v_non_retirable := v_offert_mvt;
  elsif p_type = 'refund' and p_reservation_id is not null then
    v_non_retirable := least(p_amount, coalesce((v_paye->>'non_retirable')::integer, 0));
    v_offert_mvt := least(p_amount, coalesce((v_paye->>'offert')::integer, 0));
  elsif p_type = 'recharge' or not p_is_withdrawable then
    v_non_retirable := p_amount;
  end if;

  update public.profiles set
    coin_balance   = v_new_balance,
    coins_earned   = case when p_type in ('earn', 'bonus') then coins_earned + p_amount else coins_earned end,
    coins_spent    = case
      when p_type = 'spend' then coins_spent - p_amount
      when p_type = 'refund' and p_reservation_id is not null then greatest(0, coins_spent - p_amount)
      else coins_spent
    end,
    bonus_balance  = bonus_balance + case when p_amount > 0 then v_non_retirable else -v_non_retirable end,
    offert_balance = offert_balance + case when p_amount > 0 then v_offert_mvt else -v_offert_mvt end
  where id = p_user_id;

  insert into public.coin_transactions
    (user_id, reservation_id, type, status, amount, balance_after, description, metadata, is_withdrawable)
  values
    (p_user_id, p_reservation_id, p_type, 'completed', p_amount, v_new_balance, p_description,
     case when p_amount < 0 and p_type <> 'withdraw'
          then coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('non_retirable', v_non_retirable, 'offert', v_offert_mvt)
          else p_metadata end,
     v_non_retirable = 0)
  returning id into v_tx_id;
  return v_tx_id;
end; $function$;
