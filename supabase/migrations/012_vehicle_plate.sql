-- Plaque d'immatriculation optionnelle (jamais visible par les autres users)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vehicle_plate text;
