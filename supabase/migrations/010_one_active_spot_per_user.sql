-- Empêche un utilisateur d'avoir plus d'une place active simultanément
-- (anti-fraude : on ne peut pas spammer "Je me gare" pour accumuler des SC)
CREATE UNIQUE INDEX IF NOT EXISTS one_active_spot_per_user
  ON parking_spots (sharer_id)
  WHERE status IN ('available', 'reserved');
