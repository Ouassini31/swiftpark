-- Champs véhicule dans le profil utilisateur
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_make        text,
  ADD COLUMN IF NOT EXISTS vehicle_model       text,
  ADD COLUMN IF NOT EXISTS vehicle_year        integer,
  ADD COLUMN IF NOT EXISTS vehicle_color       text,
  ADD COLUMN IF NOT EXISTS vehicle_length_cm   integer,
  ADD COLUMN IF NOT EXISTS vehicle_category    text; -- citadine | compacte | berline | suv | grand
