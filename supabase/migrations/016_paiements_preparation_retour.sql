-- Retour de 016, à passer après celui de 017. Les soldes reviennent à leur état d'avant
-- tant qu'aucun mouvement n'a eu lieu entre-temps ; les remboursements déjà faits restent acquis.

drop function public.valider_position(uuid, double precision, double precision);
drop function public.annuler_echange(uuid, numeric, text, text);

drop index public.coin_transactions_stripe_intent_unique;
drop index public.coin_transactions_stripe_session_unique;

alter function public.update_rating() security invoker;
drop policy ratings_insert_partie on public.ratings;
create policy ratings_insert_auth on public.ratings for insert with check (auth.uid() = rater_id);
create policy ratings_insert_own on public.ratings for insert with check (auth.uid() = rater_id);

drop policy stripe_orders_insert_own on public.stripe_orders;
create policy stripe_orders_own on public.stripe_orders for all to authenticated using (user_id = auth.uid());

drop policy "spots: update admin" on public.parking_spots;
drop policy "withdrawals: select admin" on public.withdrawal_requests;

drop function public.profils_publics(uuid[]);

create or replace function public.get_withdrawable_balance(p_user_id uuid) returns integer
  language sql stable security definer set search_path to 'public', 'pg_catalog' as $function$
  SELECT COALESCE(SUM(amount), 0)::integer
  FROM public.coin_transactions
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND is_withdrawable = true;
$function$;

create or replace function public.give_welcome_bonus() returns trigger
  language plpgsql security definer set search_path to 'public', 'pg_catalog' as $function$
declare v_new_balance integer;
begin
  if exists (select 1 from public.coin_transactions where user_id = new.id and type = 'bonus') then
    return new;
  end if;

  update public.profiles
     set coin_balance  = coin_balance + 5,
         bonus_balance = bonus_balance + 5,
         coins_earned  = coins_earned + 5
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

create or replace function public.profiles_argent_protege() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated')
     and ((tg_op = 'INSERT'
           and (new.coin_balance, new.bonus_balance, new.coins_earned, new.coins_spent,
                new.stripe_customer_id, new.stripe_connect_account_id,
                new.stripe_connect_payouts_enabled, new.stripe_connect_iban_last4)
               is distinct from (0, 0, 0, 0, null, null, false, null))
       or (tg_op = 'UPDATE'
           and (new.coin_balance, new.bonus_balance, new.coins_earned, new.coins_spent,
                new.stripe_customer_id, new.stripe_connect_account_id,
                new.stripe_connect_payouts_enabled, new.stripe_connect_iban_last4)
               is distinct from
               (old.coin_balance, old.bonus_balance, old.coins_earned, old.coins_spent,
                old.stripe_customer_id, old.stripe_connect_account_id,
                old.stripe_connect_payouts_enabled, old.stripe_connect_iban_last4))) then
    raise exception 'solde non modifiable' using errcode = '42501';
  end if;
  return new;
end $$;

update public.reservations set finder_notified_at = null
 where status = 'reserved' and expires_at < now() and finder_notified_at is not null;

update public.profiles set bonus_balance = offert_balance;
update public.coin_transactions set metadata = metadata - 'non_retirable' - 'offert'
 where type = 'spend' and reservation_id is not null;
update public.coin_transactions t set is_withdrawable = true
  from public.reservations r
 where r.id = t.reservation_id and t.type = 'earn' and r.finder_id = r.sharer_id;
update public.coin_transactions set is_withdrawable = true
 where type = 'earn' and reservation_id is null and description like 'Achat pack%';

alter table public.profiles drop column offert_balance;
