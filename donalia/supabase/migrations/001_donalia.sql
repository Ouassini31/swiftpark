-- ============================================================================
-- Donalia v0.4 — schéma (tables préfixées donalia_, isolées sur myneed-prod)
-- « Droits d'abord » : un besoin = le RÉSIDUEL après diagnostic des droits.
--
-- Garde-fous encodés :
--   • donalia_donations.program_id NOT NULL (don au PROGRAMME) ; need_id nullable
--   • montants en CENTIMES, besoin borné 3000..50000 (30€..500€)
--   • état `diagnostic` obligatoire ; publication contrôlée applicativement
--     (rights_diagnoses lié + gap_reason ; non_recours => activation tracée)
--   • données sensibles (diagnostic, factures, justif, bénéficiaire) hors RLS publique
-- ============================================================================

create extension if not exists "pgcrypto";

-- Reset propre (données de démo uniquement)
drop table if exists public.donalia_receipts       cascade;
drop table if exists public.donalia_proofs         cascade;
drop table if exists public.donalia_fulfillments   cascade;
drop table if exists public.donalia_rights_diagnoses cascade;
drop table if exists public.donalia_donations      cascade;
drop table if exists public.donalia_reports        cascade;
drop table if exists public.donalia_needs          cascade;
drop table if exists public.donalia_programs       cascade;
drop table if exists public.donalia_organizations  cascade;
drop type  if exists donalia_need_status           cascade;

-- ── Organisations (assos) ───────────────────────────────────────────────────
create table public.donalia_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rna text,
  is_interet_general boolean default false,
  created_at timestamptz default now()
);

-- ── Programmes (le don va ICI) ──────────────────────────────────────────────
create table public.donalia_programs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.donalia_organizations(id) on delete cascade,
  slug text unique not null,
  title text not null,
  category text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz default now()
);
create index donalia_programs_public_idx on public.donalia_programs (is_public);
create index donalia_programs_category_idx on public.donalia_programs (category);

-- ── Besoins (= résiduel après droits ; non engageant pour le don) ───────────
create table public.donalia_needs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.donalia_programs(id) on delete cascade,
  title text not null,                       -- l'OBJET : "un vélo pour aller au travail"
  amount_cents int not null check (amount_cents between 3000 and 50000),
  collected_cents int not null default 0 check (collected_cents >= 0),
  gap_reason text not null check (gap_reason in
    ('hors_couverture','non_recours','avance_delai','reste_a_charge')),
  gap_explainer text,                        -- "reste à charge après chèque énergie"
  status text not null default 'draft' check (status in
    ('draft','diagnostic','en_revue','publie','finance','achete','remis','cloture','rejete','clos_sans_suite')),
  activation_traced boolean not null default false, -- requis pour publier un non_recours
  region text,                               -- niveau région uniquement
  beneficiary_ref text,                      -- réf. anonymisée, JAMAIS nom/adresse
  justification_url text,                    -- justificatif interne (Storage privé)
  proof_required boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index donalia_needs_program_idx on public.donalia_needs (program_id);
create index donalia_needs_status_idx on public.donalia_needs (status);

-- ── Bilan des droits (OpenFisca) — SENSIBLE, asso only ──────────────────────
create table public.donalia_rights_diagnoses (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.donalia_needs(id) on delete cascade,
  estimated_aids jsonb,                      -- sortie OpenFisca (aides + montants)
  residual_cents int,                        -- reste après droits = base du besoin
  source text not null default 'openfisca',
  is_estimate boolean not null default true, -- toujours true : "seul l'organisme décide"
  note text,
  performed_at timestamptz default now()
);
create index donalia_rights_need_idx on public.donalia_rights_diagnoses (need_id);

-- ── Dons (au PROGRAMME ; need_id facultatif/non engageant) ──────────────────
create table public.donalia_donations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.donalia_programs(id),
  need_id uuid references public.donalia_needs(id),
  amount_cents int not null check (amount_cents > 0),
  tip_cents int not null default 0,          -- pourboire HelloAsso (PAS un revenu SAS)
  donor_email text not null,
  donor_name text,
  helloasso_checkout_intent_id text,
  status text not null default 'pending' check (status in ('pending','paid','refunded')),
  receipt_id uuid,
  created_at timestamptz default now()
);
create index donalia_donations_program_idx on public.donalia_donations (program_id);
create index donalia_donations_intent_idx on public.donalia_donations (helloasso_checkout_intent_id);

-- ── Achat-en-nature ─────────────────────────────────────────────────────────
create table public.donalia_fulfillments (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.donalia_needs(id) on delete cascade,
  vendor text,
  amount_cents int,
  invoice_url text,                          -- facture (Storage privé)
  purchased_at timestamptz,
  created_at timestamptz default now()
);
create index donalia_fulfillments_need_idx on public.donalia_fulfillments (need_id);

-- ── Preuve d'impact (publique une fois cloture) ─────────────────────────────
create table public.donalia_proofs (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.donalia_needs(id) on delete cascade,
  media_url text,                            -- l'OBJET remis, pas le visage
  caption text,
  published boolean not null default false,
  created_at timestamptz default now()
);
create index donalia_proofs_need_idx on public.donalia_proofs (need_id);

-- ── Reçus fiscaux (émis par l'asso) ─────────────────────────────────────────
create table public.donalia_receipts (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donalia_donations(id) on delete cascade,
  number text unique,
  amount_cents int,
  issued_at timestamptz default now(),
  pdf_url text
);

-- ── Signalements ────────────────────────────────────────────────────────────
create table public.donalia_reports (
  id uuid primary key default gen_random_uuid(),
  need_id uuid references public.donalia_needs(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);

-- updated_at auto
create or replace function public.donalia_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger donalia_needs_set_updated_at
  before update on public.donalia_needs
  for each row execute function public.donalia_set_updated_at();

-- ============================================================================
-- RLS — lecture publique minimale ; écritures via service_role (back-office)
-- ============================================================================
alter table public.donalia_organizations     enable row level security;
alter table public.donalia_programs           enable row level security;
alter table public.donalia_needs              enable row level security;
alter table public.donalia_rights_diagnoses   enable row level security;
alter table public.donalia_donations          enable row level security;
alter table public.donalia_fulfillments       enable row level security;
alter table public.donalia_proofs             enable row level security;
alter table public.donalia_receipts           enable row level security;
alter table public.donalia_reports            enable row level security;

create policy donalia_org_public_read on public.donalia_organizations
  for select using (true);

create policy donalia_programs_public_read on public.donalia_programs
  for select using (is_public = true);

create policy donalia_needs_public_read on public.donalia_needs
  for select using (status in ('publie','finance','achete','remis','cloture'));

create policy donalia_proofs_public_read on public.donalia_proofs
  for select using (
    published = true and exists (
      select 1 from public.donalia_needs n
      where n.id = need_id and n.status in ('publie','finance','achete','remis','cloture')
    )
  );

create policy donalia_reports_public_insert on public.donalia_reports
  for insert with check (true);

-- rights_diagnoses / donations / fulfillments / receipts : AUCUNE politique publique.
