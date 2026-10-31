# Refonte des quatre espaces IBN SAP — Plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les vues rôle actuelles par quatre expériences analytiques et opérationnelles réellement distinctes, connectées aux fonctionnalités existantes et protégées par rôle/périmètre serveur.

**Architecture:** Conserver Next.js App Router, les Route Handlers, Drizzle et les services existants. Établir un app shell partagé mais concevoir les quatre accueils sans réutiliser `Overview.tsx` comme contenu principal de l’ADMIN. Ajouter des routes page ciblées pour tickets, comptes rendus, évaluations et paiements, avec contrôle d’accès server-side et requêtes scoped.

**Tech Stack:** Next.js 16.4.2 (App Router, Cache Components, `proxy.ts`), React 19, TypeScript, Tailwind CSS 4, Recharts 3, Drizzle ORM/MySQL, scripts TSX, Puppeteer/Edge déjà installés.

## Global Constraints

- **Ne modifier, supprimer ou réinitialiser aucun ticket, utilisateur ou donnée MySQL.**
- **Aucune migration Drizzle** et aucune modification du schéma sans demande séparée.
- **Ne supprimer aucun fichier ni écraser les changements utilisateur ; aucun commit/push sans autorisation.**
- Les permissions doivent être vérifiées dans chaque Server Component, Server Action et Route Handler ; masquer un bouton ne constitue pas un contrôle d’accès.
- Ne pas réutiliser `Overview.tsx` comme contenu principal du nouveau cockpit ADMIN.
- Aucune équipe, capacité, métrique financière, évaluation agrégée, réglage persisté ou activité inventée.
- L’agent est limité côté serveur aux tickets assignés à son identité ; harmoniser l’identité d’affectation aux valeurs réellement stockées sans modifier les valeurs existantes.
- VIEWER reste en lecture seule ; ne jamais exposer données/menus d’un autre rôle via endpoint direct.
- Formulaires d’écriture ne sont pas soumis sur les données protégées pendant les vérifications ; E2E existants qui créent/suppriment des tickets sont interdits sur cette base.
- Textes UI en français ; responsive et accessible clavier/lecteur d’écran, respect de `prefers-reduced-motion`.

---

## Structure cible des fichiers

- `src/components/WorkspaceShell.tsx` — shell authentifié partagé : sidebar, contexte de rôle, session, navigation mobile.
- `src/components/WorkspaceNavigation.ts` — menus et règles de visibilité centralisés par rôle, sans se substituer à la validation serveur.
- `src/components/Dashboard.tsx` — orchestration des filtres globaux et composition de la page role-specific ; retirer filtres/header génériques redondants quand ils sont déplacés dans le shell.
- `src/components/AdminHome.tsx` — cockpit analytique ADMIN autonome : KPI factuels, graphiques et incidents/récents événements, sans `Overview`.
- `src/components/ManagerHome.tsx` — supervision et queues de travail par données réellement disponibles.
- `src/components/AgentHome.tsx` — espace individuel ; tickets réellement assignés, rapport/intervention et données personnelles.
- `src/components/ViewerHome.tsx` — consultation et analyses read-only.
- `src/components/RolePageHeader.tsx` — titre, description, période et actions de page.
- `src/lib/access.ts` — helpers purs `sameIdentity`, `canManageUsers`, `canReadReports`, `canReadEvaluations`, `canReadPayments` et `canWriteTickets`, typés selon le rôle.
- `src/lib/workspace-data.ts` — loaders en lecture seule `loadWorkspaceTickets(session): Promise<{issues: Issue[]; total: number}>`, `loadRecentActivity(limit: number)`, `loadManagerQueues()` et `loadViewerReports(session)`; le scope agent s’applique dans SQL avant le retour client.
- `src/app/tickets/page.tsx` — file de tickets authentifiée avec recherche/filtres et périmètre role-based.
- `src/app/reports/page.tsx` — rapports d’intervention, lecture/validation MANAGER/ADMIN et consultation AGENT de son périmètre.
- `src/app/evaluations/page.tsx` — file de comptes rendus soumis pour MANAGER/ADMIN, données personnelles contrôlées pour AGENT.
- `src/app/payments/page.tsx` — paiements visibles aux rôles autorisés, périmètre personnel agent ; pages et formulaire autorisés.
- `src/app/settings/page.tsx` — écran de paramètres informatif/local seulement, sans sauvegarde serveur ni prétention de persistance.
- `src/app/tickets/[id]/page.tsx` — corriger les gardes des Server Actions `updateTicket` et `addComment` afin de refuser VIEWER côté serveur ; déplacer les formulaires selon leurs permissions effectives.
- Routes API existantes `/api/tickets/[id]/reports`, `/api/evaluations`, `/api/payments` — ajouter/adapter uniquement des lectures scoped : VIEWER rapports `validated` seulement ; AGENT évaluations avec `agentId = session.email` ; paiements gardés ADMIN/MANAGER. Aucune modification du schéma.
- `src/app/globals.css` — tokens/shell responsive, navigation et variantes role-specific ; conserver styles graphiques actuels utiles.
- `scripts/check-access.ts` — assertions pures role/scope sans DB, cohérentes avec les scripts TSX du dépôt.

## Task 1 — Vérifier capacité de stockage des préférences

- [ ] **Étape 1 :** Inspecter le schéma, `.gitignore` et les préférences browser existantes ; ne pas se connecter à MySQL.
- [ ] **Étape 2 :** Documenter que les paramètres sont locaux au navigateur uniquement ; ne créer aucune table, migration, API d’écriture ou variable sensible.
- [ ] **Étape 3 :** Créer `scripts/check-access.ts` sans ajouter de dépendance ni se connecter à la base.
- [ ] **Étape 4 :** Exécuter `npx tsx scripts/check-access.ts`; attendu : `check-access: OK`, refus VIEWER/AGENT confirmés.

## Task 2 — Permissions/périmètre serveur testables

**Files:** Create `src/lib/access.ts`, `scripts/check-access.ts`; modify ticket/reports/evaluations/payments handlers mentionnés dans cette task.

**Interfaces produites par `src/lib/access.ts`:**

```ts
export type WorkspaceRole = "admin" | "manager" | "agent" | "viewer";
export function sameIdentity(value: string | null | undefined, email: string): boolean;
export function canManageUsers(role: WorkspaceRole): boolean;
export function canReadReports(role: WorkspaceRole, status: string, owner: string, email: string): boolean;
export function canReadEvaluations(role: WorkspaceRole, owner: string, email: string): boolean;
export function canReadPayments(role: WorkspaceRole, owner: string, email: string): boolean;
export function canWriteTickets(role: WorkspaceRole, assignee: string, email: string): boolean;
```

- [ ] **RED :** ajouter assertions pour chaque signature ci-dessus : ADMIN gère comptes; MANAGER ne gère pas comptes; VIEWER ne peut pas écrire; AGENT ne lit/écrit que les tickets dont l’assignation correspond exactement à son e-mail normalisé; VIEWER lit un rapport `validated` et refuse `draft`; AGENT lit uniquement ses évaluations/paiements personnels; seuls ADMIN/MANAGER lisent ou créent les paiements; seuls ADMIN/MANAGER évaluent.
- [ ] **Verify RED :** `npx tsx scripts/check-access.ts` échoue car `src/lib/access.ts` n’existe pas encore.
- [ ] **GREEN :** implémenter les fonctions typées ; normaliser avec `trim().toLowerCase()` et comparer les identités exactement, pas comme sous-chaînes.
- [ ] **Verify GREEN :** `npx tsx scripts/check-access.ts` affiche `check-access: OK`.
- [ ] **Intégrer côté server :** retirer le filtrage agent exécuté dans `Dashboard.tsx`; appliquer le scope dans `loadWorkspaceTickets(session)` et GET `tickets/[id]`, `history`, `comments`, `reports`; refuser tout ticket non assigné à l’agent. Ajouter GET évaluations pour AGENT filtré strictement sur `agentId = session.email`; paiements restent ADMIN/MANAGER en lecture/écriture; VIEWER reçoit seulement les rapports `validated`; MANAGER ne reçoit pas CRUD compte. Corriger les Server Actions `updateTicket` et `addComment` du détail ticket pour refuser VIEWER indépendamment de l’interface.
- [ ] **Vérifier API directes :** tester les helpers en isolation; vérifier les gardes de routes par revue/typecheck. Réponses attendues 401 sans session et 403 en cas de rôle ou owner interdit. Ne pas créer de données de test sur la base de production.

## Task 3 — Shell applicatif et navigation de routes

- [ ] Ajouter le test de configuration de navigation par rôle (menus et destinations exactes).
- [ ] Vérifier son échec initial.
- [ ] Créer `WorkspaceNavigation.ts` et `WorkspaceShell.tsx` avec navigation desktop fixe, mobile adaptée, sections actives, identité, déconnexion et menu sans accès interdit.
- [ ] Brancher `Dashboard.tsx` au shell, garder un état partagé des filtres pour les vues qui l’emploient, enlever les doublons de navigation et header.
- [ ] Tester navigation responsive et que tous les liens pointent sur des routes présentes.

## Task 4 — Cockpit ADMIN sans Overview

- [ ] Définir les tests/calculs purs : total, ouverts, clôturés, Critical/High, non assignés, tendance par date, distribution par statut/priorité, activité depuis `ticket_events`/`intervention_reports` uniquement.
- [ ] Implémenter `AdminHome.tsx` avec composition originale : header contextualisé, bande KPIs, grille charts, tableau des tickets prioritaires/récents et activité réelle. Ne pas importer `Overview`.
- [ ] Ajouter une vraie route `/tickets` accessible aux rôles pertinents, et lier le tableau à `/tickets/[id]`.
- [ ] Créer pages `/reports`, `/evaluations`, `/payments`, `/settings` selon permissions ; chaque page reçoit filtres/recherche et états loading/error/empty. Réutiliser les formulaires existants là où ils s’appliquent; ne pas prétendre avoir un workflow ou une exportation non disponible.
- [ ] Tester ADMIN et capture écran desktop/tablette/mobile.

## Task 5 — Espace MANAGER

- [ ] Agrégats sans hypothèses : tickets ouverts par `assignee`, non assignés, urgents par priorité, âge actuel; libellés de retard « > 30 jours » tant qu’aucun SLA contractuel n’est défini pour cette vue.
- [ ] Créer une vue d’accueil de supervision, file assignation et liens vers reports/evaluations/payments; désigner la source de chaque chiffre. Navigation par ancre = lien natif vers `#section` ou `scrollIntoView`, pas seulement mise à jour de la sélection active.
- [ ] S’assurer que les pages des comptes et API users répondent 403 à MANAGER.
- [ ] Tester en lecture et vérifier rendu/capture.

## Task 6 — Espace AGENT

- [ ] Tests de scope pour assignation normalisée et accès ticket direct.
- [ ] Appliquer scope serveur dans loader/API, puis vue personnelle avec compteurs dérivés, tickets, rapports, historique et évaluations personnelles via GET nouvellement ajouté et limité à `agentId = session.email`.
- [ ] Réutiliser `TicketForm` en création autorisée et `ReportForm` uniquement sur ticket assigné. Ne pas exposer `EvaluationForm` ni `PaymentForm` à AGENT tant que les endpoints correspondants ne lui accordent pas la permission scoped ; cette refonte n’élargit pas cette permission sans validation métier distincte.
- [ ] Vérifier que les tickets non assignés à l’agent ne sont pas rendus ni récupérables par API.

## Task 7 — Espace VIEWER

- [ ] Créer une composition lecture seule : KPI, graphiques, recherche et filtres, table avec liens de consultation uniquement.
- [ ] Retirer les actions create/edit/delete/comments/report/evaluation/payment et garder le refus server-side.
- [ ] Tester direct URLs/API et capture écran.

## Task 8 — Pages métier rapports, évaluations, paiements et paramètres

- [ ] Étendre les API GET pour listes paginées/filtrées uniquement si cela évite de charger toutes les données et le contrat reste compatible ; valider rôle et scope dans chaque handler.
- [ ] File rapports soumis pour ADMIN/MANAGER ; vue personnelle AGENT; form `ReportForm` liée à un ticket assigné.
- [ ] File évaluations pour ADMIN/MANAGER et vues individuelles AGENT via un GET limité à `agentId = session.email`; `EvaluationForm` liée à `reportId` réel. VIEWER n’accède à aucune évaluation.
- [ ] Paiements visibles/modifiables uniquement ADMIN/MANAGER conformément aux endpoints actuels ; AGENT et VIEWER n’ont aucun accès aux paiements dans cette passe, tant qu’une politique explicite ne change pas l’API.
- [ ] Paramètres : identifiants/session, options uniquement en state/localStorage si elles n’impliquent aucune donnée métier ; aucune route write ni persistance serveur.
- [ ] États loading/empty/error, confirmation pour transitions sensibles, affichage montants/formulaires selon rôle.

## Task 9 — Documentation et audit visuel

- [ ] Mettre à jour `DOC.md`: quatre espaces, routes, actions et limites indisponibles.
- [ ] Vérifier une composition réellement distincte de chaque rôle, pas seulement les titres/sidebar.
- [ ] Parcours navigateur (comptes existants, sans afficher de secrets): desktop 1440, tablette 820, mobile 390 ; screenshots des 4 espaces.
- [ ] Navigation exhaustive des pages, indicateurs, graphiques, filtres et états vides/erreur.
- [ ] Tests des formulaires en environnement/base de test ; aucune soumission destructive sur base contenant les tickets protégés.

## Task 10 — Validation finale

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint` (noter et ne pas masquer les warnings préexistants)
- [ ] `npm run build`
- [ ] scripts purs sécurité/données et tests dédiés role access.
- [ ] Exécuter E2E seulement si son script a été revu et dirigé vers base jetable ; ne pas lancer `scripts/e2e-test.mjs` sur la base réelle car il crée et supprime des tickets.
- [ ] Contrôle Git : aucun fichier utilisateur perdu, aucune migration, aucune modification/suppression de donnée.

## Review gates

- Après la conception, revue utilisateur du document avant l’implémentation.
- Après chaque espace rôle, revue visuelle dans navigateur avant le suivant.
- Toute donnée/fonctionnalité sans table/API ou permission explicite est reportée et signalée, jamais simulée.
