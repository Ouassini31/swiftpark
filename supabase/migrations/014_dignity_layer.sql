-- ============================================================
-- Dignity Layer — Migration 014 : Schéma initial (MVP isolé)
-- ============================================================
-- Module totalement séparé de SwiftPark.
-- Toutes les tables sont préfixées « dignity_ ».
-- Aucune dépendance avec les tables SwiftPark existantes.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type dignity_need_status as enum (
  'pending_verification',  -- Besoin déposé mais non validé
  'rejected',              -- Besoin refusé
  'verified',              -- Besoin contrôlé
  'funding',               -- Besoin visible et finançable
  'funded',                -- Montant atteint
  'completed'              -- Preuve d'impact ajoutée
);

create type dignity_urgency_level as enum (
  'faible',
  'moyenne',
  'forte',
  'critique'
);

create type dignity_document_visibility as enum (
  'admin_only',
  'public'
);

create type dignity_payment_status as enum (
  'pending',
  'paid',
  'failed'
);

-- ============================================================
-- TABLE : dignity_needs
-- Besoin concret déposé par un bénéficiaire
-- ============================================================

create table public.dignity_needs (
  id                       uuid primary key default uuid_generate_v4(),

  -- Coordonnées du bénéficiaire (stockées directement — module isolé)
  first_name               text not null,
  last_name                text not null,
  email                    text not null,
  phone                    text,

  -- Contenu du besoin
  title                    text not null,
  description              text not null,
  category                 text not null,
  country                  text not null,
  city                     text not null,
  amount_requested         numeric(12, 2) not null check (amount_requested > 0),
  amount_collected         numeric(12, 2) not null default 0 check (amount_collected >= 0),
  urgency_level            dignity_urgency_level not null default 'moyenne',

  -- Cycle de vie
  status                   dignity_need_status not null default 'pending_verification',
  is_public                boolean not null default false,
  anonymized_publication   boolean not null default true,
  main_image_url           text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  verified_at              timestamptz,
  completed_at             timestamptz
);

create index dignity_needs_status_idx     on public.dignity_needs (status);
create index dignity_needs_is_public_idx  on public.dignity_needs (is_public);
create index dignity_needs_category_idx   on public.dignity_needs (category);
create index dignity_needs_created_at_idx on public.dignity_needs (created_at desc);

-- ============================================================
-- TABLE : dignity_documents
-- Pièces justificatives liées à un besoin
-- ============================================================

create table public.dignity_documents (
  id           uuid primary key default uuid_generate_v4(),
  need_id      uuid not null references public.dignity_needs(id) on delete cascade,
  file_url     text not null,
  file_type    text,
  visibility   dignity_document_visibility not null default 'admin_only',
  created_at   timestamptz not null default now()
);

create index dignity_documents_need_id_idx on public.dignity_documents (need_id);

-- ============================================================
-- TABLE : dignity_contributions
-- Intention de contribution (pas de paiement réel en MVP)
-- ============================================================

create table public.dignity_contributions (
  id              uuid primary key default uuid_generate_v4(),
  need_id         uuid not null references public.dignity_needs(id) on delete cascade,
  donor_name      text not null,
  donor_email     text not null,
  amount          numeric(12, 2) not null check (amount > 0),
  message         text,
  payment_status  dignity_payment_status not null default 'pending',
  created_at      timestamptz not null default now()
);

create index dignity_contributions_need_id_idx on public.dignity_contributions (need_id);

-- ============================================================
-- TABLE : dignity_verification_logs
-- Journal de vérification / changements de statut (admin)
-- ============================================================

create table public.dignity_verification_logs (
  id                   uuid primary key default uuid_generate_v4(),
  need_id              uuid not null references public.dignity_needs(id) on delete cascade,
  admin_label          text,                 -- identifiant libre de l'admin (module isolé)
  verification_method  text,
  internal_note        text,
  public_note          text,
  status_before        text,
  status_after         text,
  created_at           timestamptz not null default now()
);

create index dignity_verification_logs_need_id_idx on public.dignity_verification_logs (need_id);

-- ============================================================
-- TABLE : dignity_impact_updates
-- Preuves d'impact publiées après financement
-- ============================================================

create table public.dignity_impact_updates (
  id              uuid primary key default uuid_generate_v4(),
  need_id         uuid not null references public.dignity_needs(id) on delete cascade,
  title           text not null,
  description     text not null,
  image_url       text,
  proof_file_url  text,
  created_at      timestamptz not null default now()
);

create index dignity_impact_updates_need_id_idx on public.dignity_impact_updates (need_id);

-- ============================================================
-- updated_at automatique sur dignity_needs
-- ============================================================

create or replace function public.dignity_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dignity_needs_set_updated_at
  before update on public.dignity_needs
  for each row
  execute function public.dignity_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Stratégie MVP :
--   • Lecture publique limitée aux besoins publiés (is_public = true).
--   • Lecture publique des preuves d'impact et documents « public »
--     rattachés à un besoin publié.
--   • TOUTES les écritures (dépôt de besoin, actions admin) passent par
--     des Route Handlers serveur utilisant la clé service_role, qui
--     contourne RLS. Aucune écriture anonyme n'est donc autorisée ici.
-- ============================================================

alter table public.dignity_needs            enable row level security;
alter table public.dignity_documents         enable row level security;
alter table public.dignity_contributions     enable row level security;
alter table public.dignity_verification_logs enable row level security;
alter table public.dignity_impact_updates    enable row level security;

-- Besoins : lecture publique des besoins publiés uniquement
create policy "dignity_needs_public_read"
  on public.dignity_needs
  for select
  using (is_public = true);

-- Documents publics rattachés à un besoin publié
create policy "dignity_documents_public_read"
  on public.dignity_documents
  for select
  using (
    visibility = 'public'
    and exists (
      select 1 from public.dignity_needs n
      where n.id = need_id and n.is_public = true
    )
  );

-- Preuves d'impact rattachées à un besoin publié
create policy "dignity_impact_updates_public_read"
  on public.dignity_impact_updates
  for select
  using (
    exists (
      select 1 from public.dignity_needs n
      where n.id = need_id and n.is_public = true
    )
  );

-- dignity_contributions et dignity_verification_logs : aucune policy
-- → aucun accès via les clés publiques. Tout passe par le serveur (service_role).
