# IBN SAP Dashboard

Application web de suivi des incidents SAP pour **IBN Group SARL** (Next.js 16, React 19, TypeScript, Tailwind CSS 4, Drizzle ORM, MySQL 8).

## Fonctionnalités principales
- Authentification par session JWT signée (`httpOnly` cookie) avec rôles : `admin`, `manager`, `agent`.
- Tableaux de bord et espaces dédiés par rôle (supervision, suivi tickets, rapports, paiements, etc.).
- Gestion des tickets SAP (création, consultation, mise à jour, commentaires, historique), rapports d’intervention, évaluations et paiements.
- Filtrage global combinable (statut/priorité/module/paiement/période), graphiques et indicateurs calculés à partir des données.
- Contrôles qualité sur les tickets enregistrés en base MySQL.
- Intégration Gmail (préparée/configurable) pour synchronisation/staging de messages.
- **Internationalisation FR/EN** : sélecteur de langue (FR | EN) sur la page de connexion et dans l’en-tête/session, préférence persistée par cookie (`ibn_locale`), `lang` HTML dynamique.

## Prérequis
- Node.js `>= 22.12.0` et npm `>= 10`
- MySQL 8.x (base `ibn_dashboard` ou via `DATABASE_URL`)

## Installation
```bash
npm install
cp .env.example .env.local
# Renseigner DATABASE_URL et SESSION_SECRET dans .env.local
```

Variables importantes (`.env.example`) :
- `DATABASE_URL` : connexion MySQL
- `SESSION_SECRET` : secret de signature session (>= 32 caractères recommandé)
- `GMAIL_*` : configuration OAuth Gmail (optionnel)

## Base de données
```bash
npm run db:generate   # générer migrations Drizzle
npm run db:migrate    # appliquer migrations
npm run db:check      # contrôle cohérence base
```

## Démarrage
```bash
npm run dev      # développement (http://localhost:3000)
npm run build    # build production
npm start        # serveur production
```

## Qualité et vérifications
```bash
npm run lint
npx tsc --noEmit
npm run check:security
npm run check:gmail
```

## Structure (aperçu)
- `src/app/` : pages App Router et routes API (`/api/...`)
- `src/components/` : UI (Dashboard, Sidebar, formulaires, vues par rôle)
- `src/lib/` : auth, accès RBAC, chargement données, validation, i18n, Gmail, utilitaires
- `src/db/` : schéma Drizzle et connexion
- `drizzle/` : migrations
- `scripts/` : import, contrôles et utilitaires

## Sécurité & accès
- Vérification de session côté serveur (`getSession`) avec contrôle du compte actif en base.
- Contrôles d’autorisation par rôle sur pages/routes sensibles et filtrage des données selon le périmètre (ex. agent limité à ses tickets).
- Création de tickets réservée aux rôles `admin` et `manager`.
- Validation serveur des entrées et réponses d’erreur uniformisées pour les routes API.

## Langue (FR/EN)
- Défaut : français.
- Changement via le commutateur FR/EN (login et espace connecté).
- La préférence est stockée dans le cookie `ibn_locale` et appliquée au rendu (`<html lang="...">`).

## Déploiement

Prérequis : Node.js ≥ 22.12, MySQL 8, un reverse proxy HTTPS (nginx/Caddy/Traefik).

1. Renseigner `.env.local` (ou les variables de l'environnement) :
   - `DATABASE_URL` (base MySQL dédiée, ex. `ibn_dashboard`)
   - `SESSION_SECRET` (32 caractères aléatoires minimum)
   - `GMAIL_*` et rediriger `GMAIL_REDIRECT_URI` vers `https://VOTRE_DOMAINE/api/gmail/callback`
2. Créer le schéma sur une base vide : `npm run db:push`.
   - Depuis une base existante, migrer les rôles : `agent` → `consultant` et supprimer `viewer`
     (voir `DOC.md`, section Base de données).
3. Installer et builder : `npm ci && npm run build`.
4. Démarrer : `npm start` (port 3000) ou `docker compose up -d --build`.
5. Vérifier : `/login` (200), une page protégée ( redirection 307), `/api/tickets` (401).
6. Créer/élever un compte administrateur via `/admin` ou `npx tsx scripts/create-admin.ts`.

> Le conteneur `app` n'exécute pas les migrations : le schéma doit exister avant le démarrage.
> La base `ibn_dashboard_test` de `docker-compose.yml` est un exemple ; utilisez `ibn_dashboard` en production.
