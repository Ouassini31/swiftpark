-- ============================================================
-- SwiftPark — Migration 003 : pg_cron, push_subscriptions, perf
-- ============================================================

-- Extension pg_cron (activer dans Supabase Dashboard → Extensions)
create extension if not exists pg_cron;

-- ============================================================
-- TABLE : push_subscriptions
-- Stocke les Web Push subscriptions des utilisateurs
-- ============================================================

create table public.push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  subscription jsonb not null,  -- { endpoint, keys: { auth, p256dh } }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique(user_id, (subscription->>'endpoint'))
);

alter table public.push_subscriptions enable row level security;

create policy "push_sub_own" on public.push_subscriptions
  for all using (auth.uid() = user_id);

create index push_sub_user_idx on public.push_subscriptions(user_id);

-- ============================================================
-- pg_cron : expire les places toutes les minutes
-- ============================================================

-- Appel de l'Edge Function expire-spots via pg_cron
-- (Remplacer <PROJECT_REF> et <ANON_KEY> par vos valeurs)
select cron.schedule(
  'expire-spots-job',
  '* * * * *',   -- toutes les minutes
  $$
  select
    net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/expire-spots',
      headers := '{"Authorization": "Bearer <ANON_KEY>", "Content-Type": "application/json"}',
      body := '{}'
    );
  $$
);

-- ============================================================
-- Index de performance supplémentaires
-- ============================================================

-- Places disponibles triées par distance (souvent appelé)
create index spots_available_location_idx on public.parking_spots
  using gist(location)
  where status = 'available';

-- Réservations actives par utilisateur
create index reservations_active_finder_idx on public.reservations(finder_id)
  where status = 'reserved';

create index reservations_active_sharer_idx on public.reservations(sharer_id)
  where status = 'reserved';

-- Notifications non lues
create index notif_unread_created_idx on public.notifications(user_id, created_at desc)
  where is_read = false;

-- Transactions récentes par utilisateur
create index coin_tx_user_recent_idx on public.coin_transactions(user_id, created_at desc);

-- ============================================================
-- Vue : leaderboard SwiftCoins
-- ============================================================

create or replace view public.leaderboard as
  select
    id,
    username,
    full_name,
    avatar_url,
    coins_earned,
    spots_shared,
    spots_found,
    rating,
    rating_count,
    rank() over (order by coins_earned desc) as rank
  from public.profiles
  where is_active = true
    and coins_earned > 0
  limit 50;

-- ============================================================
-- Vue : résumé financier par utilisateur
-- ============================================================

create or replace view public.user_finance_summary as
  select
    p.id as user_id,
    p.coin_balance,
    p.coins_earned,
    p.coins_spent,
    count(r_finder.id) as total_found,
    count(r_sharer.id) as total_shared,
    coalesce(sum(case when ct.type = 'commission' then abs(ct.amount) else 0 end), 0) as total_commission_paid
  from public.profiles p
  left join public.reservations r_finder on r_finder.finder_id = p.id and r_finder.status = 'completed'
  left join public.reservations r_sharer on r_sharer.sharer_id = p.id and r_sharer.status = 'completed'
  left join public.coin_transactions ct on ct.user_id = p.id
  where p.id = auth.uid()
  group by p.id;

-- ============================================================
-- Fonction : statistiques globales de l'app (admin)
-- ============================================================

create or replace function public.get_app_stats()
returns json language sql security definer as $$
  select json_build_object(
    'total_users',        (select count(*) from public.profiles),
    'active_spots',       (select count(*) from public.parking_spots where status = 'available'),
    'total_reservations', (select count(*) from public.reservations),
    'completed_today',    (select count(*) from public.reservations
                           where status = 'completed'
                             and completed_at::date = current_date),
    'coins_in_circulation', (select sum(coin_balance) from public.profiles)
  );
$$;
