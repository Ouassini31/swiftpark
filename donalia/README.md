# Donalia

> *le coup de pouce qui va droit au besoin*

Des donateurs financent des **besoins concrets** via un **programme** associatif.
Chaque besoin se clôt par une **preuve** (achat-en-nature + remise).

## Garde-fous encodés dans le produit

1. **Le don va à un programme, jamais à un individu** — `donalia_donations.program_id`
   est `NOT NULL` ; aucun champ d'UI ne permet de fléer un don vers une personne.
2. **L'association décide l'allocation** — les transitions `financé → acheté → remis`
   sont des actions back-office.
3. **L'argent ne transite jamais par l'app** — encaissement HelloAsso → compte de
   l'association. Donalia ne stocke aucun IBAN bénéficiaire.
4. **Achat-en-nature obligatoire** — clôture via `fulfillment` (facture) + `proof`.
5. **Données sensibles minimisées** — anonymat par défaut, région seule,
   justificatifs privés, RLS stricte.

## Stack

Next.js (App Router, TS) · Supabase (Postgres + RLS) · HelloAsso Checkout v5 ·
Tailwind (Fraunces + Mulish).

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés
npm run dev
```

### Variables d'environnement (`.env.local`)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lecture publique (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Écritures back-office (serveur uniquement) |
| `DONALIA_ADMIN_PASSWORD` | Mot de passe espace association |
| `HELLOASSO_*` | Checkout v5 (vide ⇒ **mode démo** sans paiement réel) |
| `NEXT_PUBLIC_SITE_URL` | URL publique (returnUrl HelloAsso) |

> Le schéma `donalia_*` est déjà appliqué sur le projet Supabase **myneed-prod**
> (`supabase/migrations/001_donalia.sql`).

## Routes

| Public | Asso |
|---|---|
| `/` accueil · `/besoins` · `/besoins/[id]` | `/admin` tableau de bord |
| `/programmes/[id]` · `/don` · `/don/merci` | `/admin/programmes` |
| `/impact/[needId]` preuve d'impact | `/admin/needs/[id]` machine à états |

## Parcours

- **Donateur** : besoin → `/don` (programme + montant) → HelloAsso → `/don/merci`
  → e-mail → notif `/impact/[needId]`.
- **Asso** : créer programme → besoin (`en_revue` → `publié`) → `financé` →
  `Acheter` (fulfillment) → `Remettre` + preuve → `Clôturer`.

## Mode démo

Sans clés HelloAsso, le don redirige vers `/don/merci?demo=1` et finalise le don
en base (sans paiement réel) — pratique pour dérouler le parcours complet.
