-- ============================================================
-- SwiftPark — Migration 001 : Schéma initial
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";        -- géolocalisation GPS
create extension if not exists "pg_trgm";        -- recherche textuelle floue

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type user_role as enum ('driver', 'admin');
create type spot_status as enum ('available', 'reserved', 'completed', 'cancelled', 'expired');
create type transaction_type as enum ('earn', 'spend', 'commission', 'refund', 'bonus');
create type transaction_status as enum ('pending', 'completed', 'failed', 'refunded');
create type validation_status as enum ('pending', 'validated', 'failed', 'disputed');

-- ============================================================
-- TABLE : profiles
-- Étendue du user Supabase Auth
-- ============================================================

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  full_name       text,
  avatar_url      text,
  role            user_role not null default 'driver',
  phone           text,

  -- SwiftCoins
  coin_balance    integer not null default 0 check (coin_balance >= 0),
  coins_earned    integer not null default 0,
  coins_spent     integer not null default 0,

  -- Statistiques conducteur
  spots_shared    integer not null default 0,
  spots_found     integer not null default 0,
  rating          numeric(3,2) check (rating between 0 and 5),
  rating_count    integer not null default 0,

  -- Localisation préférée (nullable)
  preferred_lat   double precision,
  preferred_lng   double precision,

  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABLE : parking_spots
-- Place de parking partagée par un conducteur qui part
-- ============================================================

create table public.parking_spots (
  id              uuid primary key default uuid_generate_v4(),
  sharer_id       uuid not null references public.profiles(id) on delete cascade,

  -- Géolocalisation (PostGIS)
  location        geography(Point, 4326) not null,
  lat             double precision not null,
  lng             double precision not null,
  address         text,
  city            text,
  postal_code     text,

  -- Détails
  status          spot_status not null default 'available',
  coin_price      integer not null default 10 check (coin_price > 0),
  description     text,
  is_covered      boolean default false,
  is_handicap     boolean default false,
  vehicle_type    text default 'car',   -- car, moto, truck

  -- Disponibilité estimée
  available_at    timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '15 minutes'),

  -- Validation GPS
  validation_status  validation_status not null default 'pending',
  sharer_validated   boolean default false,
  finder_validated   boolean default false,
  sharer_gps_lat     double precision,
  sharer_gps_lng     double precision,
  finder_gps_lat     double precision,
  finder_gps_lng     double precision,
  validated_at       timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index géospatial pour les requêtes de proximité
create index parking_spots_location_idx on public.parking_spots using gist(location);
create index parking_spots_status_idx   on public.parking_spots(status);
create index parking_spots_sharer_idx   on public.parking_spots(sharer_id);
create index parking_spots_expires_idx  on public.parking_spots(expires_at);

-- ============================================================
-- TABLE : reservations
-- Un conducteur réserve une place partagée
-- ============================================================

create table public.reservations (
  id              uuid primary key default uuid_generate_v4(),
  spot_id         uuid not null references public.parking_spots(id) on delete cascade,
  finder_id       uuid not null references public.profiles(id) on delete cascade,
  sharer_id       uuid not null references public.profiles(id) on delete cascade,

  status          spot_status not null default 'reserved',

  -- Paiement SwiftCoins
  coin_amount     integer not null check (coin_amount > 0),
  commission      integer not null,         -- 25% du coin_amount
  sharer_receive  integer not null,         -- 75% du coin_amount

  -- Timestamps
  reserved_at     timestamptz not null default now(),
  confirmed_at    timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz,
  expires_at      timestamptz not null default (now() + interval '10 minutes'),

  cancel_reason   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Un finder ne peut avoir qu'une seule réservation active à la fois
  constraint unique_active_reservation unique (finder_id, status)
    deferrable initially deferred
);

create index reservations_spot_idx    on public.reservations(spot_id);
create index reservations_finder_idx  on public.reservations(finder_id);
create index reservations_sharer_idx  on public.reservations(sharer_id);
create index reservations_status_idx  on public.reservations(status);

-- ============================================================
-- TABLE : coin_transactions
-- Historique de tous les mouvements de SwiftCoins
-- ============================================================

create table public.coin_transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  reservation_id  uuid references public.reservations(id) on delete set null,

  type            transaction_type not null,
  status          transaction_status not null default 'pending',
  amount          integer not null,         -- positif = crédit, négatif = débit
  balance_after   integer not null,

  description     text not null,
  metadata        jsonb default '{}',

  created_at      timestamptz not null default now()
);

create index coin_tx_user_idx         on public.coin_transactions(user_id);
create index coin_tx_reservation_idx  on public.coin_transactions(reservation_id);
create index coin_tx_type_idx         on public.coin_transactions(type);

-- ============================================================
-- TABLE : gps_validations
-- Logs des validations GPS en temps réel
-- ============================================================

create table public.gps_validations (
  id              uuid primary key default uuid_generate_v4(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,

  role            text not null check (role in ('sharer', 'finder')),
  lat             double precision not null,
  lng             double precision not null,
  accuracy        double precision,         -- précision GPS en mètres
  distance_to_spot double precision,        -- distance calculée à la place

  is_valid        boolean not null,
  validated_at    timestamptz not null default now()
);

create index gps_val_reservation_idx on public.gps_validations(reservation_id);

-- ============================================================
-- TABLE : ratings
-- Système de notation après chaque transaction
-- ============================================================

create table public.ratings (
  id              uuid primary key default uuid_generate_v4(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  rater_id        uuid not null references public.profiles(id) on delete cascade,
  rated_id        uuid not null references public.profiles(id) on delete cascade,

  score           integer not null check (score between 1 and 5),
  comment         text,

  created_at      timestamptz not null default now(),

  unique(reservation_id, rater_id)
);

-- ============================================================
-- TABLE : notifications
-- ============================================================

create table public.notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  reservation_id  uuid references public.reservations(id) on delete set null,

  type            text not null,  -- spot_found, reservation_confirmed, payment_received, etc.
  title           text not null,
  body            text not null,
  data            jsonb default '{}',
  is_read         boolean not null default false,

  created_at      timestamptz not null default now()
);

create index notifications_user_idx    on public.notifications(user_id);
create index notifications_unread_idx  on public.notifications(user_id, is_read) where is_read = false;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Mise à jour automatique du champ updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger parking_spots_updated_at
  before update on public.parking_spots
  for each row execute function public.handle_updated_at();

create trigger reservations_updated_at
  before update on public.reservations
  for each row execute function public.handle_updated_at();

-- Création automatique du profil après inscription Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Calcul automatique commission et part partageur
create or replace function public.calculate_reservation_coins()
returns trigger language plpgsql as $$
declare
  v_price integer;
begin
  select coin_price into v_price from public.parking_spots where id = new.spot_id;

  new.coin_amount   := v_price;
  new.commission    := round(v_price * 0.25);
  new.sharer_receive := v_price - round(v_price * 0.25);

  return new;
end;
$$;

create trigger reservation_coins_calc
  before insert on public.reservations
  for each row execute function public.calculate_reservation_coins();

-- Expiration automatique des places (appelée via pg_cron ou Edge Function)
create or replace function public.expire_old_spots()
returns void language plpgsql as $$
begin
  update public.parking_spots
  set status = 'expired'
  where status = 'available'
    and expires_at < now();
end;
$$;

-- Mise à jour du solde et stats après transaction
create or replace function public.process_coin_transaction(
  p_user_id       uuid,
  p_amount        integer,
  p_type          transaction_type,
  p_description   text,
  p_reservation_id uuid default null,
  p_metadata      jsonb default '{}'
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
    coin_balance = v_new_balance,
    coins_earned = case when p_amount > 0 then coins_earned + p_amount else coins_earned end,
    coins_spent  = case when p_amount < 0 then coins_spent  + abs(p_amount) else coins_spent end
  where id = p_user_id;

  insert into public.coin_transactions
    (user_id, reservation_id, type, status, amount, balance_after, description, metadata)
  values
    (p_user_id, p_reservation_id, p_type, 'completed', p_amount, v_new_balance, p_description, p_metadata)
  returning id into v_tx_id;

  return v_tx_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.parking_spots     enable row level security;
alter table public.reservations      enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.gps_validations   enable row level security;
alter table public.ratings           enable row level security;
alter table public.notifications     enable row level security;

-- Profiles : chacun voit son profil, tous peuvent voir les profils publics
create policy "profiles_select_public"  on public.profiles for select using (true);
create policy "profiles_update_own"     on public.profiles for update using (auth.uid() = id);

-- Parking spots : lecture publique des places disponibles
create policy "spots_select_available"  on public.parking_spots for select using (true);
create policy "spots_insert_auth"       on public.parking_spots for insert with check (auth.uid() = sharer_id);
create policy "spots_update_own"        on public.parking_spots for update using (auth.uid() = sharer_id);
create policy "spots_delete_own"        on public.parking_spots for delete using (auth.uid() = sharer_id);

-- Reservations : finder et sharer peuvent voir leurs réservations
create policy "reservations_select_own" on public.reservations for select
  using (auth.uid() = finder_id or auth.uid() = sharer_id);
create policy "reservations_insert_auth" on public.reservations for insert
  with check (auth.uid() = finder_id);
create policy "reservations_update_parties" on public.reservations for update
  using (auth.uid() = finder_id or auth.uid() = sharer_id);

-- Transactions : chacun voit les siennes
create policy "coin_tx_select_own"  on public.coin_transactions for select using (auth.uid() = user_id);

-- GPS validations : les parties concernées
create policy "gps_val_select_own"  on public.gps_validations for select using (auth.uid() = user_id);
create policy "gps_val_insert_auth" on public.gps_validations for insert with check (auth.uid() = user_id);

-- Ratings
create policy "ratings_select_public" on public.ratings for select using (true);
create policy "ratings_insert_auth"   on public.ratings for insert with check (auth.uid() = rater_id);

-- Notifications : chacun voit les siennes
create policy "notif_select_own"  on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update_own"  on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- DONNÉES INITIALES (coins de bienvenue)
-- ============================================================

-- Bonus de bienvenue : 50 SwiftCoins offerts à l'inscription
-- (déclenché via Edge Function après handle_new_user)
