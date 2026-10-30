-- Retour de 015 : rouvre le trou (chacun peut se créditer). À n'utiliser qu'en cas de panne.

create or replace function public.process_coin_transaction(
  p_user_id uuid, p_amount integer, p_type public.transaction_type, p_description text,
  p_reservation_id uuid default null, p_metadata jsonb default '{}'::jsonb, p_is_withdrawable boolean default true
) returns uuid
  language plpgsql security definer set search_path to 'public', 'pg_catalog' as $function$
declare v_current_balance integer; v_new_balance integer; v_tx_id uuid;
begin
  if auth.uid() is null or (auth.uid() != p_user_id and auth.role() <> 'service_role') then
    raise exception 'Unauthorized: cannot process transactions for another user';
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

create policy withdraw_insert_own on public.withdrawal_requests for insert with check (auth.uid() = user_id);

drop trigger reservations_montants_proteges on public.reservations;
drop function public.reservations_montants_proteges();

drop trigger profiles_argent_protege on public.profiles;
drop function public.profiles_argent_protege();
