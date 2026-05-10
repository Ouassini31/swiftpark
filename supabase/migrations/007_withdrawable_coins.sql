-- ============================================================
-- Migration 007 : Distinction SC réels vs SC bonus
-- Les SC gagnés via partage réel sont retirables en euros.
-- Les SC bonus (inscription, parrainage, promos) ne le sont pas.
-- ============================================================

-- 1. Colonne is_withdrawable sur coin_transactions
alter table public.coin_transactions
  add column if not exists is_withdrawable boolean not null default true;

-- Les transactions de type 'bonus' existantes → non retirables
update public.coin_transactions
  set is_withdrawable = false
  where type = 'bonus';

-- 2. bonus_balance sur profiles (SC non retirables disponibles)
alter table public.profiles
  add column if not exists bonus_balance integer not null default 0;

-- Initialise bonus_balance d'après les transactions existantes
update public.profiles p
  set bonus_balance = coalesce((
    select sum(amount)
    from public.coin_transactions t
    where t.user_id = p.id
      and t.is_withdrawable = false
      and t.amount > 0
  ), 0);

-- 3. Nouvelle version de process_coin_transaction avec p_is_withdrawable
create or replace function public.process_coin_transaction(
  p_user_id         uuid,
  p_amount          integer,
  p_type            transaction_type,
  p_description     text,
  p_reservation_id  uuid    default null,
  p_metadata        jsonb   default '{}',
  p_is_withdrawable boolean default true
)
returns uuid language plpgsql security definer as $$
declare
  v_current_balance integer;
  v_new_balance     integer;
  v_tx_id           uuid;
begin
  select coin_balance into v_current_balance
  from public.profiles where id = p_user_id for update;

  v_new_balance := v_current_balance + p_amount;

  if v_new_balance < 0 then
    raise exception 'Solde insuffisant';
  end if;

  update public.profiles
  set
    coin_balance  = v_new_balance,
    coins_earned  = case when p_amount > 0 then coins_earned + p_amount else coins_earned end,
    coins_spent   = case when p_amount < 0 then coins_spent  + abs(p_amount) else coins_spent end,
    -- bonus_balance : on créédite si gain bonus, on débite en priorité si dépense
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
end;
$$;
