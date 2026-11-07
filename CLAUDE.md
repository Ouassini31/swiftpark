# SwiftPark — repères pour les sessions

Projet Supabase : `lxsxgsembmhalystjhlb`. Migrations versionnées dans `supabase/migrations/`
(chacune avec son `_retour.sql`), appliquées par migration, jamais à la main.

## Alerte Supabase `rls_disabled_in_public` sur `spatial_ref_sys`

- Cette alerte est **CONNUE et COUVERTE** par le verrou d'écriture du 07/11/2026, migration
  `021_spatial_ref_sys_lecture_seule` (version `20261107035148` en base).
  - Les visiteurs et les comptes de l'app (`anon`, `authenticated`) ne peuvent plus rien écrire dans
    cette table, et la lecture reste ouverte.
  - Les rôles internes (`supabase_admin`, `postgres`, `service_role`) écrivent comme avant.
- Elle **restera affichée** dans les advisors : la table appartient à `supabase_admin`, et seul
  Supabase peut y activer RLS.
- **Contrôle :** deux déclencheurs `spatial_ref_sys_lecture_seule_*` sont actifs sur
  `public.spatial_ref_sys`. À revérifier après une restauration ou un changement de version de
  Postgres.
- **Retour :** `021_spatial_ref_sys_lecture_seule_retour.sql`. Il supprime la fonction en cascade,
  car `drop trigger` est refusé à `postgres`.
- **Une alerte `rls_disabled_in_public` sur une AUTRE table est un vrai problème à traiter.**

## Points ouverts relevés le 07/11/2026, non traités

- PostGIS installé dans `public`.
- 16 fonctions `SECURITY DEFINER` appelables sans compte (dont les `dl_*`).
- 23 fonctions `SECURITY DEFINER` appelables avec un compte.
- Protection contre les mots de passe fuités désactivée.
