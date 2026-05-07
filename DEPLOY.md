# SwiftPark — Guide de déploiement

## 1. Prérequis locaux

```bash
brew install node          # Node.js 20 LTS
npm install                # dépendances
npx playwright install     # browsers Playwright
```

Copier et remplir les variables d'environnement :
```bash
cp .env.local.example .env.local
# → Éditer .env.local avec vos vraies clés Supabase
```

---

## 2. Supabase — appliquer les migrations

Dans le **Supabase Dashboard → SQL Editor**, exécutez dans l'ordre :

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_edge_functions.sql   ← remplacer <PROJECT_REF>
supabase/migrations/004_admin_analytics.sql
supabase/migrations/005_align_prototype.sql
```

> **pg_cron** : dans `003_`, remplacez `<PROJECT_REF>` par l'ID de votre projet
> (visible dans l'URL du Dashboard : `https://supabase.com/dashboard/project/XXXX`).

---

## 3. Générer les clés VAPID (push notifications)

```bash
npx web-push generate-vapid-keys
```

Copiez les 2 clés dans `.env.local`.

---

## 4. Lancer en local

```bash
npm run dev        # http://localhost:3000
```

---

## 5. Tests E2E (Playwright)

> Créez d'abord un compte `marie@exemple.fr / motdepasse` dans Supabase Auth
> (Dashboard → Authentication → Users → Add User).

```bash
npm test                   # tous les projets
npm run test:ui            # mode UI interactif
npm run test:report        # voir le dernier rapport HTML
```

---

## 6. Déploiement Vercel

### A. Créer le projet Vercel

```bash
npm i -g vercel
vercel login
vercel link           # dans le dossier swiftpark/
```

### B. Ajouter les secrets Vercel

```bash
vercel secret add swiftpark_supabase_url         "https://xxxx.supabase.co"
vercel secret add swiftpark_supabase_anon_key    "eyJ..."
vercel secret add swiftpark_service_role_key     "eyJ..."
vercel secret add swiftpark_app_url              "https://swiftpark.vercel.app"
vercel secret add swiftpark_vapid_public         "B..."
vercel secret add swiftpark_vapid_private        "x..."
```

### C. Déployer

```bash
vercel --prod
```

---

## 7. GitHub Actions — secrets requis

Dans **GitHub → Settings → Secrets → Actions** :

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL publique Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon |
| `TEST_USER_EMAIL` | Email du compte de test E2E |
| `TEST_USER_PASSWORD` | Mot de passe du compte de test |
| `VERCEL_TOKEN` | Token API Vercel (`vercel whoami --token`) |
| `VERCEL_ORG_ID` | ID org Vercel (`.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | ID projet Vercel (`.vercel/project.json`) |

---

## 8. Pipeline CI/CD

```
push → main
  ├── lint (ESLint + tsc)
  ├── build (next build)
  ├── e2e  (Playwright mobile-chrome)
  └── deploy → Vercel Production
```

Les PRs déclenchent lint + build + e2e sans déployer.
