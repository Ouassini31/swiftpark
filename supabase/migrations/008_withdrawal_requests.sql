-- Table des demandes de retrait SwiftCoins → virement SEPA
create table if not exists public.withdrawal_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount_sc     integer not null check (amount_sc >= 20),
  amount_eur    numeric(10,2) not null,
  iban          text not null,
  account_name  text not null,
  status        text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
  notes         text,
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);

-- Index pour retrouver les demandes par utilisateur
create index if not exists withdrawal_requests_user_id_idx
  on public.withdrawal_requests(user_id);

-- RLS : les utilisateurs voient uniquement leurs propres demandes
alter table public.withdrawal_requests enable row level security;

create policy "users can view own withdrawal requests"
  on public.withdrawal_requests for select
  using (auth.uid() = user_id);

-- La création passe par le service role (API route) pour valider le solde d'abord
create policy "service role can insert withdrawal requests"
  on public.withdrawal_requests for insert
  with check (true);
