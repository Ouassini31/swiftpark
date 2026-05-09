-- Dénormaliser le gabarit du sharer dans le spot
-- → les marqueurs peuvent afficher la taille sans charger le profil du sharer
ALTER TABLE parking_spots
  ADD COLUMN IF NOT EXISTS sharer_vehicle_category text;
