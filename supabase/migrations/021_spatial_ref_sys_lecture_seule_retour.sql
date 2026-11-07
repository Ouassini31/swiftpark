-- Retour de 021 : retire le verrou d'écriture de spatial_ref_sys.
-- postgres n'est pas propriétaire de la table et ne peut pas faire « drop trigger ».
-- Supprimer la fonction en cascade emporte les deux déclencheurs qui en dépendent.
drop function if exists public.spatial_ref_sys_lecture_seule() cascade;
