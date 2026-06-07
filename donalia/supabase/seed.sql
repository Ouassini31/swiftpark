-- ============================================================================
-- Donalia v0.4 — données de démonstration (Supabase SQL Editor).
-- À lancer sur une base où les tables donalia_ sont vides.
-- ============================================================================

insert into public.donalia_organizations (id, name, rna, is_interet_general)
values ('00000000-0000-0000-0000-0000000000aa', 'Association Donalia', 'W123456789', true)
on conflict (id) do nothing;

insert into public.donalia_programs (id, org_id, slug, category, title, description, is_public) values
 ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000aa',
  'mobilite-vers-emploi','mobilite','Mobilité vers l''emploi',
  'Lever les blocages de mobilité qui empêchent l''accès ou le maintien dans l''emploi, une fois les aides existantes activées.', true),
 ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000aa',
  'numerique-pour-tous','numerique','Numérique pour tous',
  'Équiper en matériel informatique de base les personnes en insertion ou en études, après examen des dispositifs existants.', true)
on conflict (id) do nothing;

-- Besoins (amount_cents = résiduel après droits)
insert into public.donalia_needs
 (id, program_id, title, amount_cents, collected_cents, gap_reason, gap_explainer, status, activation_traced, region, beneficiary_ref) values
 ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000b1',
  'Un vélo pour aller au travail', 18000, 7000, 'reste_a_charge',
  'reste à charge après l''aide au vélo de la collectivité', 'publie', false, 'Hauts-de-France', 'BEN-014'),
 ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000b1',
  'Réparation d''un scooter pour une prise de poste', 22000, 22000, 'avance_delai',
  'aide accordée mais versée trop tard pour la date d''embauche : on avance', 'finance', false, 'Normandie', 'BEN-019'),
 ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000b2',
  'Un ordinateur portable reconditionné pour une formation', 25000, 9000, 'hors_couverture',
  'aucun dispositif ne couvre cet achat dans sa situation', 'publie', false, 'Occitanie', 'BEN-022'),
 ('00000000-0000-0000-0000-0000000000c4','00000000-0000-0000-0000-0000000000b2',
  'Un téléphone pour les démarches en ligne', 12000, 12000, 'non_recours',
  'un droit existe mais n''était pas activé : activation tracée, on finance le résiduel', 'cloture', true, 'Grand Est', 'BEN-027');

-- Bilans des droits (un par besoin)
insert into public.donalia_rights_diagnoses (need_id, estimated_aids, residual_cents, source, note)
select id,
  case
    when gap_reason = 'reste_a_charge' then '{"Aide vélo collectivité": 12000}'::jsonb
    when gap_reason = 'avance_delai' then '{"Aide mobilité Pôle emploi": 22000}'::jsonb
    when gap_reason = 'non_recours' then '{"Forfait inclusion numérique": 8000}'::jsonb
    else '{}'::jsonb
  end,
  amount_cents, 'saisie_agent', 'Bilan de démonstration — estimation, seul l''organisme décide.'
from public.donalia_needs;

-- Preuve d'impact + achat sur le besoin clôturé
insert into public.donalia_proofs (need_id, media_url, caption, published)
select id, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900',
       'Téléphone reconditionné acheté chez un reconditionneur local et remis. Démarches en ligne désormais possibles.',
       true
from public.donalia_needs where status = 'cloture' limit 1;

insert into public.donalia_fulfillments (need_id, vendor, amount_cents, invoice_url, purchased_at)
select id, 'Reconditionneur local', 12000, 'https://example.org/factures/ben-027.pdf', now()
from public.donalia_needs where status = 'cloture' limit 1;
