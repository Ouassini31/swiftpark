-- Retour de 017 : referme le chemin serveur et arrête l'expiration automatique. À passer avant celui de 016.

select cron.unschedule('expirer-echanges');
drop function public.expirer_echanges();

create or replace function public.process_coin_transaction(
  p_user_id uuid, p_amount integer, p_type public.transaction_type, p_description text,
  p_reservation_id uuid default null, p_metadata jsonb default '{}'::jsonb, p_is_withdrawable boolean default true
) returns uuid
  language plpgsql security definer set search_path to 'public', 'pg_catalog' as $function$
declare v_current_balance integer; v_new_balance integer; v_tx_id uuid; v_resa public.reservations;
begin
  if auth.uid() is null or (auth.uid() != p_user_id and auth.role() <> 'service_role') then
    raise exception 'Unauthorized: cannot process transactions for another user';
  end if;

  if auth.role() <> 'service_role' then
    select * into v_resa from public.reservations where id = p_reservation_id for update;
    if not coalesce(p_is_withdrawable and case p_type
      when 'spend' then
        v_resa.finder_id = p_user_id and v_resa.sharer_id <> p_user_id
        and p_amount < 0 and p_amount = -v_resa.coin_amount
        and v_resa.sharer_receive = v_resa.coin_amount - round(v_resa.coin_amount * 0.25)
        and exists (select 1 from public.parking_spots s
                    where s.id = v_resa.spot_id and s.sharer_id = v_resa.sharer_id and s.coin_price = v_resa.coin_amount)
      when 'earn' then
        v_resa.sharer_id = p_user_id and v_resa.status = 'completed'
        and p_amount > 0 and p_amount = v_resa.sharer_receive
        and exists (select 1 from public.coin_transactions t
                    where t.reservation_id = v_resa.id and t.user_id = v_resa.finder_id
                      and t.type = 'spend' and t.amount = -v_resa.coin_amount)
        and not exists (select 1 from public.coin_transactions t
                        where t.reservation_id = v_resa.id and t.type in ('earn', 'refund'))
      else false
    end, false) then
      raise exception 'Mouvement de pièces non autorisé' using errcode = '42501';
    end if;
  end if;

  select coin_balance into v_current_balance from public.profiles where id = p_user_id for update;
  v_new_balance := v_current_balance + p_amount;
  if v_new_balance < 0 then raise exception 'Solde insuffisant'; end if;
  update public.profiles set
    coin_balance  = v_new_balance,
    coins_earned  = case when p_amount > 0 then coins_earned + p_amount else coins_earned end,
    coins_spent   = case when p_amount < 0 then coins_spent  + abs(p_amount) else coins_spent end,
    bonus_balance = case
      when p_amount > 0 and not p_is_withdrawable then bonus_balance + p_amount
      when p_amount < 0 then greatest(0, bonus_balance + p_amount)
      else bonus_balance
    end
  where id = p_user_id;
  insert into public.coin_transactions
    (user_id, reservation_id, type, status, amount, balance_after, description, metadata, is_withdrawable)
  values
    (p_user_id, p_reservation_id, p_type, 'completed', p_amount, v_new_balance, p_description, p_metadata, p_is_withdrawable)
  returning id into v_tx_id;
  return v_tx_id;
end; $function$;
