-- SwiftPark — Migration 006 : push_subscriptions, rating cols, wallet/stripe

-- ── push_subscriptions ───────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade unique,
  subscription jsonb not null,
  created_at   timestamptz default now()
);
alter table public.push_subscriptions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'push_subscriptions' and policyname = 'push_subs_own'
  ) then
    create policy "push_subs_own" on public.push_subscriptions
      for all to authenticated using (user_id = auth.uid());
  end if;
end $$;

create index if not exists push_sub_user_idx on public.push_subscriptions(user_id);

-- ── rating columns on profiles ────────────────────────────────────────────
alter table public.profiles
  add column if not exists rating_avg   numeric(3,1) default 0,
  add column if not exists rating_count integer      default 0;

-- ── coin_packs (Stripe products) ─────────────────────────────────────────
create table if not exists public.coin_packs (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  coins           integer not null,
  price_eur_cents integer not null,
  stripe_price_id text,
  bonus_pct       integer default 0,
  is_popular      boolean default false,
  sort_order      integer default 0
);

-- Seed packs
insert into public.coin_packs (name, coins, price_eur_cents, bonus_pct, is_popular, sort_order)
values
  ('Starter',  50,  199, 0,  false, 1),
  ('Popular', 130,  499, 6,  true,  2),
  ('Pro',     300, 999, 20, false, 3),
  ('Max',     700, 1999, 40, false, 4)
on conflict do nothing;

alter table public.coin_packs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'coin_packs' and policyname = 'coin_packs_public'
  ) then
    create policy "coin_packs_public" on public.coin_packs for select using (true);
  end if;
end $$;

-- ── stripe_orders (historique achats) ────────────────────────────────────
create table if not exists public.stripe_orders (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references public.profiles(id) on delete cascade,
  pack_id             uuid references public.coin_packs(id),
  stripe_session_id   text unique,
  stripe_payment_intent text,
  status              text default 'pending' check (status in ('pending','paid','failed','refunded')),
  coins               integer not null,
  amount_eur_cents    integer not null,
  created_at          timestamptz default now(),
  paid_at             timestamptz
);
alter table public.stripe_orders enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'stripe_orders' and policyname = 'stripe_orders_own'
  ) then
    create policy "stripe_orders_own" on public.stripe_orders
      for all to authenticated using (user_id = auth.uid());
  end if;
end $$;

create index if not exists stripe_orders_user_idx on public.stripe_orders(user_id);
create index if not exists stripe_orders_session_idx on public.stripe_orders(stripe_session_id);
