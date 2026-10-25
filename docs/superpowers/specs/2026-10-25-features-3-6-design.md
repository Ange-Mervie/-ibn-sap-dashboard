# Design — Features 3 à 6 du dashboard IBN SAP

**Date** : 2026-10-25 · **Statut** : validé par l'utilisateur · **Projet** : ibn-sap-dashboard (page unique Next.js)

## 1. Contexte et décisions validées

Le dashboard de suivi des incidents SAP (98 tickets, 3 sections, filtres croisés type Power BI,
37 tests e2e) doit intégrer 4 évolutions reprises d'un cahier des charges générique de gestion
de tâches, **adaptées aux données SAP réelles** :

| Décision | Choix validé |
|---|---|
| Périmètre | Adapter au dashboard SAP actuel (pas de nouveau projet, pas de colonnes à ajouter) |
| Alertes (feature 3) | **Dans l'application** — aucun e-mail, aucun SMTP, aucun planificateur |
| Définition du « retard » | **SLA simulé par priorité** : Critical 3 j, High 7 j, Medium 14 j, Low 30 j (constantes modifiables) |
| Feature 4 | 4 graphiques de performance (semaine, tendance, responsable, nature) |
| Feature 5 | **Les 4 éléments** : presets de période, Gantt, export PDF, responsive |
| Architecture | **Page unique enrichie** — une 4e section, même état de filtres global |
| Images | Aucune image existante ne sera modifiée ni remplacée |

## 2. Données réelles (vérifiées le 2026-10-25)

- 98 tickets ; 56 clôturés, 42 ouverts ; périodes 04/01/2026 → 07/10/2026.
- Priorités présentes : Critical, High, Medium (**aucun Low** — le seuil Low existe pour l'avenir).
- **42/42 ouverts sont déjà hors SLA** (ancienneté mini 18 j > SLA max 14 j) ; dont 3 Critical.
- 0 ticket à échéance ≤ 48 h aujourd'hui (groupe structurellement présent, vide en l'état).
- 15 bloqués / en attente client.
- Taux de respect SLA global : **75 %** (42/56 clôturés avec dates dans les temps).
- 3 nouveaux contrôles de qualité : **0 anomalie** dans le fichier actuel.
- Aucune colonne d'échéance, aucune colonne de responsable affecté :
  « responsable » = **`Raised By`** (seule colonne personne, affiché avec cette réserve explicite).

## 3. Section A — SLA et alertes (feature 3)

**Nouveau fichier `src/lib/sla.ts`** (logique pure, commentée en français, constantes en tête) :

```ts
export const SLA_DAYS = { Critical: 3, High: 7, Medium: 14, Low: 30 };
export const WARNING_HOURS = 48;
```

- **Échéance** = `openDate + SLA_DAYS[priorité]` ; sans `openDate` ou priorité inconnue →
  ticket « non évaluable » (jamais compté comme en retard).
- **En retard** = encore ouvert (`status ≠ Closed`) ET échéance < aujourd'hui.
- **Échéance proche** = ouvert ET reste 0 à 2 jours.
- **Bloqué / en attente** = Blocked, On Hold, waiting for Customer.

**Panneau d'alertes** (composant `src/components/Alerts.tsx`, dans l'en-tête sous les filtres) :

- Bouton **« Alertes (n) »** + badge rouge ; clic = déplie/replie le panneau.
- 3 groupes : 🔴 En retard · 🟠 Échéance ≤ 48 h · 🟡 Bloqués / en attente.
- Groupe retard : **top 8** (tri jours de retard desc, puis priorité) + ligne « … et n autres »
  avec bascule **« Tout afficher »** (42 lignes au besoin).
- Ligne : `n° — description · priorité · module · Raised By · âge · +X j de retard` (ou `J-2`).
- **Ouverture automatique si ≥ 1 Critical en retard** (aujourd'hui : 3 → ouvert) ; sinon replié,
  badge visible.
- Calculée sur **tous les tickets** (état du jour), indépendamment des filtres globaux.
- Note affichée (chiffres recalculés à chaque affichage, jamais codés en dur) :
  « X/X ouverts sont hors SLA — le fichier ne contient aucun ticket récent ».

## 4. Section B — Indicateurs de performance (feature 4)

**Nouveau composant `src/components/Performance.tsx`**, 4e section de la page
(titre « Performance et planning », en-tête avec `public/banner/meeting.jpg` existant),
adossée à l'état de filtres global.

Bandeau de 4 KPI : clôturés sur 7 jours · délai moyen · taux de respect SLA · tickets hors SLA.

Graphiques :

1. **Clôturés par semaine** — barres hebdomadaires par `closeDate`.
2. **Délai moyen par mois de clôture** — courbe de tendance.
3. **Taux de respect SLA par responsable** — barres horizontales %, responsable = `Raised By`,
   note explicite sous le graphique.
4. **Taux de respect SLA par nature** — barres % avec bascule **Module SAP | Priorité**
   (2 boutons, une zone graphique).

Définitions affichées sous les graphiques :

- Taux = parmi les **clôturés avec dates calculables**, part où `closeDate − openDate ≤ SLA_DAYS[priorité]`.
- Chaque % affiche sa base (`n = …`) ; tickets sans dates exclus et signalés.

## 5. Section C — Lecture et partage (feature 5)

**C1 — Presets de période** : pastilles « Ce mois » · « Ce trimestre » · « Tout » dans l'en-tête,
à côté des inputs date existants ; elles remplissent `Filters.from/to` d'après la date du jour
(basé sur aujourd'hui, ex. octobre 2026 → mois courant / 4e trimestre). Une saisie manuelle des
dates désactive la pastille active. Tout passe par l'état `Filters` unique.

**C2 — Gantt** (`src/components/Gantt.tsx`, sans dépendance) :

- Lignes = tickets ; barre `openDate → closeDate` (ouvert → aujourd'hui si non clôturé) ;
  couleur = priorité ; **barre rouge uniquement si le ticket est encore ouvert ET hors SLA**
  (un ticket clôturé garde sa couleur de priorité — il n'est plus en retard).
- Grille mensuelle, axe des jours, tri par `openDate`, zone de défilement interne (~420 px),
  défilement horizontal sur mobile.
- Filtré par l'état global ; présent dans l'ordre de la 4e section après les graphiques.

**C3 — Export PDF** : bouton « Export PDF » dans l'en-tête → `window.print()` ;
styles `@media print` dans `globals.css` : sidebar / navigation / filtres masqués,
`print-color-adjust: exact`, `break-inside: avoid` sur les panneaux, titre et date conservés.
Aucune dépendance serveur.

**C4 — Responsive** : paliers KPI 2→6 colonnes, en-tête empilé, zones tactiles ≥ 40 px,
Gantt scrollable ; tests e2e ajoutés en 390 px (mobile) et 820 px (tablette).

## 6. Section D — Contrôles qualité (feature 6)

3 contrôles ajoutés dans `loadIssues.ts` (affichage identique à l'existant, dans Analyse),
total **11 contrôles** :

1. `Close Date` antérieure à `Open Date` (n° fautifs listés) — attendu : 0.
2. `Raised By` manquant — attendu : 0.
3. Statut hors des 6 statuts normalisés — attendu : 0.

Principe : **signalé, jamais masqué** ; les lignes de résumé Excel restent exclues des calculs.

## 7. Architecture et fichiers

| Fichier | Action |
|---|---|
| `src/lib/sla.ts` | **nouveau** — constantes SLA, `dueDate`, `isLate`, `hoursLeft`, évaluation (pur) |
| `src/components/Alerts.tsx` | **nouveau** — panneau d'alertes + badge |
| `src/components/Performance.tsx` | **nouveau** — KPI, 4 graphiques, bascule nature, Gantt |
| `src/components/Gantt.tsx` | **nouveau** — planning pur (divs + CSS) |
| `src/components/Dashboard.tsx` | 4e entrée sidebar, boutons alertes + PDF + presets, panneau d'alertes |
| `src/components/Analysis.tsx` | affiche les 11 contrôles |
| `src/lib/loadIssues.ts` | 3 nouveaux contrôles |
| `src/app/globals.css` | styles `@media print`, styles Gantt, responsive |
| `scripts/check-data.ts` | affiche les nouveaux contrôles |
| `scripts/e2e-test.mjs` | +10 tests (liste §8) |

Flux de données inchangé : `loadIssues` (serveur) → `IssueData` → `Dashboard` (état `Filters`)
→ sections. Aucune logique dupliquée : SLA et filtres restent dans `lib/` (purs, testables).

**Gestion des cas limites** : ticket sans date → non évaluable ; groupe d'alerte vide →
« Aucun ticket dans cette catégorie » ; aucune donnée pour un graphique → message existant ;
`window.print()` n'est pas déclenché en tests headless (on vérifie le bouton et les CSS).

## 8. Tests et vérification

- `scripts/check-data.ts` : affiche les 3 nouveaux contrôles.
- e2e en **plus** des 37 existants (conservés intacts) :
  1. badge d'alertes, panneau ouvert (3 Critical), top-8, « Tout afficher » → 42 lignes ;
  2. pastille « Ce mois » → période filtrée ; « Tout » → 98 ;
  3. Gantt rendu (lignes + barres) ;
  4. bouton PDF présent + règles `@media print` ;
  5. section Performance : KPI + 4 graphiques, taux SLA ≈ 75 % ;
  6. 11 contrôles qualité affichés ;
  7. mobile 390 px : navigation et en-tête empilés.
- Vérifications finales : `npx tsc --noEmit` · `npm run lint` · `npm run build` ·
  `node scripts/e2e-test.mjs` complet.

## 9. Hors périmètre (validé)

E-mail/SMTP/planificateur · responsable affecté (donnée inexistante) · échéance réelle
(colonne absente) · nouvelles colonnes Excel · modifications d'images ·
dashboard < 390 px au-delà du responsive de base.

## 10. Livraison

`DOC.md` mis à jour (nouvelle section Interactivité conservée + Features 3-6 documentées),
commit unique, **push sur `https://github.com/Ange-Mervie/-ibn-sap-dashboard`** (remote déjà
configuré), aucun toucher au dépôt `cv`.
