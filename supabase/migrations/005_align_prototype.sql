-- ============================================================
-- SwiftPark — Migration 005 : Alignement prototype
-- Passer le bonus de bienvenue de 50 à 5 SC
-- ============================================================

-- Remplace la fonction de bienvenue
create or replace function public.give_welcome_bonus()
returns trigger language plpgsql security definer as $$
begin
  perform public.process_coin_transaction(
    new.id,
    5,
    'bonus',
    '🎁 Bienvenue sur SwiftPark — 5 SwiftCoins offerts !'
  );
  return new;
end;
$$;

-- Ajouter le champ horizon sur parking_spots (pour filtrage front)
alter table public.parking_spots
  add column if not exists horizon text
    generated always as (
      case
        when extract(epoch from (expires_at - now())) / 60 <= 5   then 'now'
        when extract(epoch from (expires_at - now())) / 60 <= 20  then '15'
        when extract(epoch from (expires_at - now())) / 60 <= 75  then '1h'
        else '2h'
      end
    ) stored;

-- Index sur l'horizon pour filtrage rapide
create index if not exists spots_horizon_idx on public.parking_spots(horizon)
  where status = 'available';

-- Légende des couleurs par horizon (référence)
comment on column public.parking_spots.horizon is
  'now=#22956b | 15=#f59e0b | 1h=#3b82f6 | 2h=#7c3aed';
