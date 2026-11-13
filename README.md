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
- Docker : `Dockerfile`, `docker-compose.yml` fournis.
- Configurer les variables d’environnement (`DATABASE_URL`, `SESSION_SECRET`, `GMAIL_*` si utilisé) dans l’environnement cible.
