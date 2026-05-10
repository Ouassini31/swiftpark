-- Migration 013 : colonnes pour le système de nudge pré-départ (Moment 4)
-- + colonne cancelled_at / cancel_reason / finder_notified_at manquants

-- parking_spots : tracking du nudge
ALTER TABLE parking_spots
  ADD COLUMN IF NOT EXISTS nudge_sent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS nudge2_sent_at    timestamptz,
  ADD COLUMN IF NOT EXISTS sharer_confirmed  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at      timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason     text;

-- reservations : tracking notification finder après annulation
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS cancelled_at        timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason       text,
  ADD COLUMN IF NOT EXISTS finder_notified_at  timestamptz;

-- Index pour la Edge Function (cherche les places qui expirent dans une fenêtre)
CREATE INDEX IF NOT EXISTS idx_spots_expires_nudge
  ON parking_spots (expires_at, status, nudge_sent_at)
  WHERE status IN ('available', 'reserved') AND sharer_confirmed = false;

-- pg_cron : planifier pre-departure-nudge toutes les minutes
-- (nécessite que la Edge Function soit déployée et que pg_cron soit activé)
SELECT cron.schedule(
  'pre-departure-nudge',
  '* * * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/pre-departure-nudge',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;

COMMENT ON COLUMN parking_spots.nudge_sent_at    IS 'Timestamp du premier nudge pré-départ envoyé';
COMMENT ON COLUMN parking_spots.nudge2_sent_at   IS 'Timestamp du second nudge (2 min après le premier)';
COMMENT ON COLUMN parking_spots.sharer_confirmed IS 'Le sharer a confirmé son départ via le bouton in-app';
COMMENT ON COLUMN reservations.finder_notified_at IS 'Timestamp où le finder a été notifié du remboursement automatique';
