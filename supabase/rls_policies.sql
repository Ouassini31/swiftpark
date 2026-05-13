-- ============================================================
-- SwiftPark — Row Level Security
-- Colle ce fichier dans Supabase → SQL Editor → Run
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les profils (carte, leaderboard, SpotSheet)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Chaque user modifie uniquement son propre profil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Insert via trigger Supabase Auth (service role) — pas de policy INSERT nécessaire
-- Delete via API service role — pas de policy DELETE nécessaire


-- ── 2. PARKING_SPOTS ────────────────────────────────────────
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;

-- Tous les spots disponibles sont visibles (carte publique)
CREATE POLICY "spots_select_all"
  ON parking_spots FOR SELECT
  USING (true);

-- Seul le sharer peut créer une place
CREATE POLICY "spots_insert_own"
  ON parking_spots FOR INSERT
  WITH CHECK (auth.uid() = sharer_id);

-- Le sharer peut mettre à jour sa propre place
CREATE POLICY "spots_update_own"
  ON parking_spots FOR UPDATE
  USING (auth.uid() = sharer_id);

-- Seul le service role peut supprimer (admin / cancel)
-- (pas de policy DELETE = interdit pour les users authentifiés)


-- ── 3. RESERVATIONS ─────────────────────────────────────────
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Le finder ET le sharer peuvent voir la réservation
CREATE POLICY "reservations_select_own"
  ON reservations FOR SELECT
  USING (auth.uid() = finder_id OR auth.uid() = sharer_id);

-- Un user authentifié peut créer une réservation (finder)
CREATE POLICY "reservations_insert"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = finder_id);

-- Le finder ou le sharer peut mettre à jour (statut, GPS…)
CREATE POLICY "reservations_update_own"
  ON reservations FOR UPDATE
  USING (auth.uid() = finder_id OR auth.uid() = sharer_id);


-- ── 4. COIN_TRANSACTIONS ────────────────────────────────────
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Chaque user voit uniquement ses propres transactions
CREATE POLICY "txn_select_own"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/Update uniquement via RPC (service role) — pas de policy directe


-- ── 5. PUSH_SUBSCRIPTIONS ───────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_select_own"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_insert_own"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_update_own"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "push_delete_own"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);


-- ── 6. WITHDRAWAL_REQUESTS ──────────────────────────────────
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Chaque user voit ses propres demandes
CREATE POLICY "withdraw_select_own"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Seul le user peut créer une demande pour lui-même
CREATE POLICY "withdraw_insert_own"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update uniquement via service role (admin change status)
-- (pas de policy UPDATE = interdit pour les users)


-- ── 7. GPS_VALIDATIONS ──────────────────────────────────────
ALTER TABLE gps_validations ENABLE ROW LEVEL SECURITY;

-- Le user concerné peut lire ses propres validations
CREATE POLICY "gps_select_own"
  ON gps_validations FOR SELECT
  USING (auth.uid() = user_id);

-- Le user peut insérer sa propre validation GPS
CREATE POLICY "gps_insert_own"
  ON gps_validations FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── 8. RATINGS ──────────────────────────────────────────────
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Les notes sont publiques (profil du partageur)
CREATE POLICY "ratings_select_all"
  ON ratings FOR SELECT
  USING (true);

-- Seul l'auteur peut soumettre sa note
CREATE POLICY "ratings_insert_own"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);


-- ── 9. NOTIFICATIONS ────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifs_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifs_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert via service role (API /api/notify)


-- ── 10. COIN_PACKS ──────────────────────────────────────────
ALTER TABLE coin_packs ENABLE ROW LEVEL SECURITY;

-- Catalogue public (wallet)
CREATE POLICY "packs_select_all"
  ON coin_packs FOR SELECT
  USING (true);

-- Insert/Update/Delete uniquement via service role (admin)


-- ── 11. STRIPE_ORDERS ───────────────────────────────────────
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_orders_select_own"
  ON stripe_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/Update via service role (webhook Stripe)


-- ── VUES (pas de RLS sur les vues, elles héritent des tables) ──
-- active_spots_detail, admin_reservations, daily_transactions,
-- daily_reservations, top_sharers, top_finders → pas d'ALTER TABLE nécessaire
-- Mais si ce sont des tables : activer RLS ci-dessous

-- Si top_sharers / top_finders sont des tables (pas des vues) :
-- ALTER TABLE top_sharers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "top_sharers_select_all" ON top_sharers FOR SELECT USING (true);
-- ALTER TABLE top_finders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "top_finders_select_all" ON top_finders FOR SELECT USING (true);

-- ── FIN ──────────────────────────────────────────────────────
-- Vérifie dans Supabase → Authentication → Policies que toutes
-- les tables ont le bouton RLS vert.
