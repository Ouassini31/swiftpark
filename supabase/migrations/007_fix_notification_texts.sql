-- SwiftPark — Migration 007 : Correction textes notifications (conformité légale)
-- Remplace toute connotation "réservation de place" par "achat d'information"

create or replace function public.notify_on_reservation()
returns trigger language plpgsql security definer as $$
begin
  -- Notifier le sharer : son info a été achetée
  insert into public.notifications (user_id, reservation_id, type, title, body)
  values (
    new.sharer_id,
    new.id,
    'reservation_received',
    '👀 Ton info a été achetée !',
    'Un conducteur se dirige vers toi. Prépare-toi à partir.'
  );

  -- Notifier le finder : info confirmée
  insert into public.notifications (user_id, reservation_id, type, title, body)
  values (
    new.finder_id,
    new.id,
    'reservation_confirmed',
    '✅ Info confirmée !',
    'Dirige-toi vers la place et valide ton arrivée GPS.'
  );

  return new;
end;
$$;
