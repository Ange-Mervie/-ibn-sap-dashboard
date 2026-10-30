# IBN SAP Dashboard — Documentation

Tableau de bord de suivi et d'analyse des incidents SAP pour **IBN GROUP SARL**.
Application de consultation et d'analyse : elle **ne modifie jamais** le fichier Excel source.

---

## 1. Démarrage

```bash
npm install        # installer les dépendances (une seule fois)
npm run dev        # mode développement → http://localhost:3000
```

Autres commandes :

```bash
npm run build      # build de production
npm start          # serveur de production (après build)
npm run lint       # vérification ESLint
npx tsc --noEmit   # vérification TypeScript
node scripts/e2e-test.mjs   # tests fonctionnels (serveur démarré sur :3000)
npx tsx scripts/check-data.ts  # contrôle rapide des données chargées
npm run db:generate   # génère une migration Drizzle (MySQL)
npm run db:migrate    # applique les migrations sur ibn_dashboard
npm run db:import     # import idempotent du classeur Excel → MySQL
npm run db:check      # contrôle de la base MySQL (98 tickets attendus)
npm run check:gmail   # contrôle Gmail préparé (non configuré)
npx tsx scripts/check-security.ts  # contrôles sécurité (validators, secrets)
```

---

## 2. Architecture

```
data/
  IBN-SAP SUPPORT-Issue-Tracking-SCDP UPDATED.xlsx   ← source de vérité (copie du fichier original)
  taches.xlsx                                        ← ancien fichier, non utilisé par le dashboard
src/
  app/
    page.tsx          → point d'entrée (serveur) : charge l'Excel, rend l'application
    layout.tsx        → balise HTML globale, titre, métadonnées
    loading.tsx       → état « chargement »
    error.tsx         → état « erreur » (ex. fichier Excel introuvable)
    globals.css       → styles globaux + animation de la bande d'images
  components/
    Banner.tsx        → bande d'images défilante (haut de page)
    Dashboard.tsx     → état global des filtres, en-tête, chips, barre latérale, assemblage des 3 sections
    SectionHeader.tsx → en-tête de section avec image de fond
    Overview.tsx      → section 1 : Vue générale (KPI, graphiques, tableau prioritaire)
    IssueTable.tsx    → section 2 : Suivi (tableau, recherche, tri, pagination, export CSV)
    Analysis.tsx      → section 3 : Analyse (délais, ancienneté, paiement, alertes, contrôles)
    Charts.tsx        → graphiques réutilisables (recharts) : couleurs, infobulles, clics et pastilles de catégories
  lib/
    issues.ts         → types, constantes, filtres globaux (Filters, applyFilters) et fonctions PURS (client + serveur)
    loadIssues.ts     → lecteur Excel (côté serveur uniquement, utilise fs + xlsx)
scripts/
  check-data.ts       → affiche les chiffres clés et les contrôles qualité
  e2e-test.mjs        → tests automatisés navigateur (puppeteer-core + Edge)
public/banner/        → images de la bande défilante et des en-têtes de section
```

**Principe de séparation** : `issues.ts` ne contient aucun accès au système de fichiers
(il est donc importable par les composants React côté navigateur) ; tout le lecture
d'Excel se fait dans `loadIssues.ts`, exécuté uniquement sur le serveur.

La page est rendue **à chaque requête** (`export const instant = false` +
`await connection()`) car l'ancienneté des tickets dépend de la date du jour.

---

## 3. Source des données

| Élément | Valeur |
|---|---|
| Fichier | `data/IBN-SAP SUPPORT-Issue-Tracking-SCDP UPDATED.xlsx` |
| Feuille | `PM Issue Tracking` |
| En-tête | ligne 14 du classeur |
| Lignes de données | lignes 15 à 112 → **98 tickets** |
| Lignes 1 à 10 | en-tête + résumés (totaux) → **exclues des calculs**, utilisées pour vérification |
| Autres feuilles | `RECOMMENDATIONS`, `Key - Do Not Delete`, `-Disclaimer-` → ignorées |
| Période réelle | 04/01/2026 au 07/10/2026 (calculée à partir des dates) |

Colonnes lues : `Issue No.`, `Issue Description`, `Status`, `Priority`, `SAP module`,
`Raised By`, `open Date`, `Close Date`, `Payment status`, `Comments`.

Pour mettre à jour les données : remplacer le fichier dans `data/` (même nom, même feuille),
aucune modification de code nécessaire.

---

## 4. Indicateurs et leurs définitions

Tous les chiffres sont calculés à partir des **lignes détaillées** (jamais recopiés
des résumés Excel).

| Indicateur | Définition |
|---|---|
| Total tickets | nombre de lignes avec un Issue No. |
| Clôturés | `Status = Closed` |
| Ouverts | tous les statuts ≠ Closed (Not Started, In Progress, On Hold, Blocked, waiting for Customer **restent distingués**) |
| Critical + High | comptage des priorités Critical et High |
| Bloqués / en attente | ouverts avec statut Blocked, On Hold ou waiting for Customer |
| Délai moyen | moyenne de (Close Date − Open Date) **uniquement sur les tickets ayant les 2 dates valides** → 56/98 tickets, moyenne 7,9 jours |
| Ancienneté | date du jour − open Date, pour les tickets ouverts |
| Évolution mensuelle | ouverts comptés par mois d'`open Date`, clôturés par mois de `Close Date` |

**Payment status** est traité **séparément** du statut de résolution :
`INVOICED` ≠ `PAID` (facturé ne signifie pas payé) ; les valeurs vides sont
affichées « Non renseigné » et jamais assimilées à un statut quelconque.

---

## 5. Interactivité de type Power BI (filtrage croisé)

L'état des filtres est **global et unique** (type `Filters`, défini dans
`src/lib/issues.ts` et stocké dans `Dashboard.tsx`) : KPI, graphiques, tableau,
compteur d'en-tête et chips dérivent tous de la même source filtrée
(`applyFilters`). Aucun filtre indépendant ne peut se contredire.

### Ce qui est cliquable

| Élément | Action |
|---|---|
| Pastilles de catégories (priorité, module, paiement) | bascule le filtre de cette dimension |
| Parts du camembert des statuts + sa légende | bascule le filtre statut |
| Barres du graphique temporel | filtre la période sur le mois (récliquer = annuler) |
| Barres des graphiques en barres | bascule le filtre de la catégorie cliquée |
| Filtres d'en-tête (statut, priorité, module, paiement, 2 dates) | modifient le même état global |
| Chips « Sélection active » | suppriment le filtre correspondant |
| Bouton « Réinitialiser les filtres » | remet l'état complet à vide |

### Règles de filtrage

- Filtres **combinables (logique ET)** : par ex. Critical **ET** MM_INVENTORY.
- Chaque graphique **exclut sa propre dimension** du filtre
  (`applyFilters(issues, filters, "priority")`, etc.) : les autres catégories
  restent visibles et cliquables, les autres dimensions sont bien appliquées,
  et la catégorie active est surlignée (les non retenues sont atténuées).
- Le graphique temporel reçoit les données **sans** filtre de période : le mois
  sélectionné reste visible, mis en évidence, et récliquable pour annuler.
- Sélection active toujours visible : chips dans l'en-tête, valeurs synchronisées
  dans les listes déroulantes, surbrillance bleue dans les graphiques.
- Aucun résultat → bandeau explicite « Aucun ticket ne correspond à la
  combinaison de filtres actuelle » avec un bouton de réinitialisation.
- Infobulles des graphiques interactifs : « Cliquez pour filtrer ».

---

## 6. Contrôles qualité (affichés dans la section Analyse)

Vérifications exécutées à chaque chargement :

1. Doublons d'identifiants → **aucun**
2. Total détaillé vs résumé Excel → **98 = 98** ✓
3. Statuts résumé vs détail → **concordants** ✓
4. Priorités résumé vs détail → **concordants** ✓
5. Module SAP renseigné → **2 anomalies signalées** (1 vide, 1 « BLANK »)
6. Clôturés avec date de clôture → **complets** ✓
7. Ouverts avec date d'ouverture → **complets** ✓
8. Payment status renseigné → **55 tickets sans valeur** (signalé, pas masqué)

Les écarts sont **signalés, jamais corrigés ni masqués**.

---

## 7. Points d'attention (règles explicites)

La section Analyse produit 7 alertes, chacune justifiée par une règle vérifiable :

| Alerte | Règle |
|---|---|
| Tickets Critical encore ouverts | Priority = Critical ET statut ≠ Closed |
| Tickets bloqués | statut = Blocked |
| En attente client > 30 jours | statut = waiting for Customer ET ancienneté > 30 j |
| Ouverts > 90 jours | statut ≠ Closed ET (date du jour − open Date) > 90 j |
| Délai de résolution > 30 j | Close Date − Open Date > 30 jours |
| Clôturés sans paiement | statut = Closed ET Payment status vide |
| Sans module SAP valide | SAP module vide ou « BLANK » |

Chaque alerte affiche le nombre de tickets concernés et leurs numéros.

---

## 8. Limites connues

1. **Pas de modification des tickets** : version consultive uniquement (comme demandé).
   *(Remarque Phase 1 : la persistance MySQL + API REST autorise désormais la création,
   la modification et le commentaire via `/api/tickets*`; l'Excel source n'est jamais modifié.)*
2. **Pas de SLA ni de taux de satisfaction** : ces informations n'existent pas dans le fichier.
3. **Délais calculables sur 56/98 tickets seulement** (42 tickets ouverts sans Close Date) ;
   le délai moyen est donc affiché avec sa base de calcul visible.
4. **Aucune donnée inventée** : les valeurs manquantes apparaissent comme
   « Information absente » ou « Non renseigné ».
5. **Tendances temporelles** : calculées par mois d'ouverture/clôture ; la couverture
   (janvier à octobre 2026) est suffisante pour une lecture mensuelle, mais les volumes
   mensuels faibles limitent l'interprétation statistique.
6. **Export CSV** : séparateur `;` (compatible Excel francophone), encodage UTF-8 avec BOM.
7. **Test responsive** : vérifié à 1440 px (desktop) et 820 px (tablette) via captures
   d'écran automatisées ; non testé sur mobile très étroit (< 400 px).
8. `data/taches.xlsx` (ancien fichier de tâches) est conservé mais **inutilisé**.

---

## 9. Tests exécutés

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur (2 warnings `<img>` assumés : images décoratives) |
| `npm run build` | ✓ build de production réussi |
| `node scripts/e2e-test.mjs` | **56/56 tests réussis**, 0 erreur JavaScript |
| `npx tsx scripts/check-data.ts` | chiffres et contrôles conformes |
| `npx tsx scripts/check-sla.ts` | SLA simulé : late=42, due=0, blocked=15, criticalLate=3 |
| `npx tsx scripts/check-metrics.ts` | métriques : slaRate=75% |
| `npm run db:check` | base MySQL : 98 tickets, 9 contrôles |
| `npm run check:gmail` | Gmail préparé : not_configured, règles actives |

Tests couverts par `e2e-test.mjs` :

- **Base** : valeurs KPI, rendu des graphiques, filtre statut (98 → 56),
  réinitialisation, recherche, effacement, pagination (9 pages), tri par
  priorité, contenu de l'export CSV (99 lignes), présence des 3 sections,
  navigation tablette, absence d'erreurs JavaScript.
- **Power BI (filtrage croisé)** :
  1. Clic sur « Critical » dans le graphique des priorités → Total **16**,
     tableau à 16 lignes, déroulant en-tête synchronisé, chip visible ;
  2. le camembert des statuts se met à jour → **3 statuts** distincts parmi
     les Critical (au lieu de 6) ;
  3. ajout du module MM_INVENTORY → combinaison ET = **1 ticket** (n° 11) ;
     le graphe des priorités garde ses 2 catégories (filtre propre exclu) ;
  4. réinitialisation → retour à **98** tickets, plus aucune sélection active ;
  5. clic « Closed » dans le camembert → **56** tickets ;
  6. combinaison sans résultat (Critical + Not Started) → Total **0**,
     message « Aucun ticket ne correspond… » affiché, tableau vide ;
  7. clic sur la barre de janvier du graphique temporel → période filtrée,
     Total **7**, chip « Période : 01/01/2026 → 31/01/2026 » ; nouveau clic
     → désactivation et retour à **98**.

---

## 10. Tickets persistants (MySQL + Drizzle ORM)

Phase 1 — évolution du dashboard vers une application de gestion de tickets :

- **Base** : MySQL 8.3 local (`ibn_dashboard`, port `3306`), accès via Drizzle ORM
  (`drizzle-orm` + driver `mysql2`) et migrations Drizzle (`drizzle-kit`).
- **Schéma** : `tickets`, `ticket_comments`, `ticket_events`, `email_messages`,
  `sync_runs`, `gmail_tokens`, `ticket_counters`.
- **Import** : `npm run db:import` → import idempotent du classeur Excel
  (les identifiants existants sont ignorés — `INSERT IGNORE`).
- **Loader** : `src/lib/loadDb.ts` → `loadIssueDataFromDb()` (même `IssueData` que le lecteur Excel).
- **API** : 
  - `POST /api/tickets` → création (numéro `SAP-YYYY-NNNN` via compteur verrouillé).
  - `GET /api/tickets/[id]`, `PATCH /api/tickets/[id]`, `DELETE /api/tickets/[id]`.
  - `GET /api/tickets/[id]/history`, `POST /api/tickets/[id]/comments`.
  - Validation serveur via `src/lib/validate.ts` (messages en français, rejets 400).
- **UI** : `/tickets/nouveau` (formulaire), `/tickets/[id]` (détail, modification, historique, commentaires).

---

## 11. Gmail (préparé — non connecté)

- Variables d'environnement : `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `GMAIL_SYNC_LABEL`, `GMAIL_SENDER_DOMAINS`, `GMAIL_SUBJECT_KEYWORDS` (voir `.env.example`).
- Flux : `/api/gmail/auth-url` → `/api/gmail/callback` → jetons en base (`gmail_tokens`) → `/api/gmail/sync`.
- Synchronisation → staging (`email_messages`, `sync_runs`) ; actions humaines via
  `/api/gmail/staging` (`converted` | `linked` | `ignored`).
- **Aucune synchronisation automatique** (polling) : création/modification/rattachement
  restent des actions humaines validées via l'API.

---

## 12. Sécurité et limites

- Aucun secret committé (`.env.local` ignoré, `!.env.example` autorisé).
- Rédaction serveur des tickets via validateurs (`src/lib/validate.ts`) ; réponses 400/401/404.
- Odoo : intégration non prévue (instance inaccessible) — colonne `source` (`excel` | `form` | `email`).

---

## 13. Refonte professionnelle — espaces ADMIN / MANAGER / AGENT / VIEWER

Mission : « REFONTE PROFESSIONNELLE DU DASHBOARD SAP — GESTION DES INCIDENTS, ACTIVITÉS ET PERFORMANCES ».

### 13.1 Nouvelle identité visuelle des espaces

- **Barre latérale fixe** (`src/components/Sidebar.tsx`) avec navigation **par rôle**.
- **Espaces distincts** rendus selon le rôle connecté (`src/components/Dashboard.tsx`) :
  - **Admin** (`AdminHome.tsx`) : vue globale — KPI, graphiques, **dernières activités**.
  - **Manager** (`ManagerHome.tsx`) : supervision — tickets à affecter, critiques, en retard, charge de travail par agent.
  - **Agent** (`AgentHome.tsx`) : espace personnel — salutation, KPIs métier, « Mes tickets ».
  - **Viewer** (`ViewerHome.tsx`) : consultation seule — incidents, répartitions, évolution.
- Design : bleu professionnel, surfaces blanches / gris clair, badges couleurs, KPI modernes, graphiques avec légendes, tableaux lisibles, formulaires structurés.

### 13.2 Modules fonctionnels livrés

- **Compte rendu d'intervention** (`/api/tickets/[id]/reports`, `ReportForm`) — statut `submitted`.
- **Évaluation travail** (`/api/evaluations`, `EvaluationForm`) — décision `validated | to_correct | rejected`.
- **Suivi paiements** (`/api/payments`, `PaymentForm`) — statut `validationStatus`, balance `max(0, planned - paid)`.

### 13.3 Authentification / RBAC

- `src/lib/auth.ts` : scrypt + JWT (HS256, cookie `ibn_session`, 8 h), rôles `admin | manager | agent | viewer`.
- `src/proxy.ts` : routes protégées (`WRITE_APIS`, `PROTECTED_PAGES`), décodage JWT côté proxy.
- Espace Manager peut désormais gérer (assigner / modifier) les tickets ; l'Espace Viewer est en **lecture seule**.

### 13.4 Vérifications finales

- `npx tsc --noEmit` : 0 erreur · `npm run lint` : 0 erreur · `npm run build` : OK
- `node scripts/e2e-test.mjs` : **60/60 tests réussis**
- `npx tsx scripts/check-db.ts`, `check-sla.ts`, `check-metrics.ts`, `check-gmail.ts`, `check-security.ts` : OK

### 13.5 État

- HEAD : `79f5b05` — refonte visuelle des 4 espaces (Admin / Manager / Agent / Viewer).
- Base MySQL conservée : 98 tickets, 0 résidu, utilisateurs intacts.
