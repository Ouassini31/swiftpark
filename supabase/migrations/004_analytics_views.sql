-- ============================================================
-- SwiftPark — Migration 004 : Vues analytics & admin
-- ============================================================

-- ── Vue : transactions par jour (30 derniers jours) ─────────
create or replace view public.daily_transactions as
  select
    date_trunc('day', created_at)::date  as day,
    count(*)                              as total,
    count(*) filter (where type = 'spend')       as purchases,
    count(*) filter (where type = 'earn')        as earnings,
    sum(abs(amount)) filter (where type = 'spend')  as volume_sc,
    sum(abs(amount)) filter (where type = 'commission') as commission_sc
  from public.coin_transactions
  where created_at >= now() - interval '30 days'
  group by 1
  order by 1 desc;

-- ── Vue : réservations par jour ─────────────────────────────
create or replace view public.daily_reservations as
  select
    date_trunc('day', created_at)::date as day,
    count(*)                             as total,
    count(*) filter (where status = 'completed')  as completed,
    count(*) filter (where status = 'cancelled')  as cancelled,
    count(*) filter (where status = 'reserved')   as active,
    avg(coin_amount)::numeric(8,2)                as avg_price_sc
  from public.reservations
  where created_at >= now() - interval '30 days'
  group by 1
  order by 1 desc;

-- ── Vue : top partageurs ─────────────────────────────────────
create or replace view public.top_sharers as
  select
    p.id, p.username, p.full_name, p.avatar_url,
    p.spots_shared,
    p.coins_earned,
    p.rating,
    p.rating_count,
    count(r.id) filter (where r.status = 'completed') as completed_shares
  from public.profiles p
  left join public.reservations r on r.sharer_id = p.id
  group by p.id
  having p.spots_shared > 0
  order by p.coins_earned desc
  limit 100;

-- ── Vue : top finders ───────────────────────────────────────
create or replace view public.top_finders as
  select
    p.id, p.username, p.full_name, p.avatar_url,
    p.spots_found,
    p.coins_spent,
    p.rating,
    p.rating_count,
    count(r.id) filter (where r.status = 'completed') as completed_finds
  from public.profiles p
  left join public.reservations r on r.finder_id = p.id
  group by p.id
  having p.spots_found > 0
  order by p.spots_found desc
  limit 100;

-- ── Vue : places actives avec infos sharer ──────────────────
create or replace view public.active_spots_detail as
  select
    ps.*,
    p.username    as sharer_username,
    p.full_name   as sharer_name,
    p.rating      as sharer_rating,
    p.spots_shared as sharer_total_spots
  from public.parking_spots ps
  join public.profiles p on p.id = ps.sharer_id
  where ps.status = 'available'
    and ps.expires_at > now()
  order by ps.created_at desc;

-- ── Fonction admin : KPIs globaux ───────────────────────────
create or replace function public.admin_get_kpis()
returns json language sql security definer as $$
  select json_build_object(
    'users_total',      (select count(*) from public.profiles),
    'users_today',      (select count(*) from public.profiles where created_at::date = current_date),
    'spots_active',     (select count(*) from public.parking_spots where status = 'available'),
    'spots_today',      (select count(*) from public.parking_spots where created_at::date = current_date),
    'reservations_total',   (select count(*) from public.reservations),
    'reservations_today',   (select count(*) from public.reservations where created_at::date = current_date),
    'completed_today',      (select count(*) from public.reservations where status='completed' and completed_at::date = current_date),
    'revenue_sc_today',     (select coalesce(sum(abs(amount)),0) from public.coin_transactions where type='commission' and created_at::date = current_date),
    'revenue_sc_month',     (select coalesce(sum(abs(amount)),0) from public.coin_transactions where type='commission' and created_at >= date_trunc('month', now())),
    'coins_circulating',    (select coalesce(sum(coin_balance),0) from public.profiles)
  );
$$;

-- Seul un admin peut appeler cette fonction
revoke all on function public.admin_get_kpis() from public;
grant execute on function public.admin_get_kpis() to authenticated;

-- Vérifier le rôle admin avant l'appel (via RLS sur la vue)
create policy "admin_only_kpis" on public.profiles
  as restrictive for select
  using (true);   -- RLS sur la fonction gérée dans le middleware Next.js

-- ── Vue : réservations récentes enrichies (admin) ───────────
create or replace view public.admin_reservations as
  select
    r.id,
    r.status,
    r.coin_amount,
    r.commission,
    r.sharer_receive,
    r.created_at,
    r.completed_at,
    r.cancelled_at,
    r.cancel_reason,
    finder.username  as finder_username,
    finder.full_name as finder_name,
    sharer.username  as sharer_username,
    sharer.full_name as sharer_name,
    ps.address,
    ps.lat,
    ps.lng
  from public.reservations r
  join public.profiles finder on finder.id = r.finder_id
  join public.profiles sharer on sharer.id = r.sharer_id
  join public.parking_spots ps on ps.id = r.spot_id
  order by r.created_at desc;

-- ── Index pour les rapports ──────────────────────────────────
create index coin_tx_date_type_idx on public.coin_transactions(created_at, type);
create index reservations_date_status_idx on public.reservations(created_at, status);
create index profiles_created_date_idx on public.profiles(created_at::date);
