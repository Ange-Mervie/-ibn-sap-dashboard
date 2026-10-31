# Refonte fonctionnelle et visuelle des quatre espaces IBN SAP

**Date :** 2026-10-31  
**Statut :** conception confirmée par l’utilisateur (A+B, pages fonctionnelles incluses)  
**Registre :** application métier interne  
**Personnalité :** professionnelle, claire et fiable

## Objectif

Remplacer la composition actuelle — notamment l’accueil ADMIN qui réutilise `Overview.tsx` — par quatre espaces métier réellement distincts. Chaque rôle obtient sa propre hiérarchie, navigation et surface de travail. La refonte réutilise les APIs/services existants et applique les permissions au serveur et au périmètre des données.

## Principes visuels confirmés

- Combiner les deux directions montrées : **centre de pilotage analytique** pour la lecture d’ensemble, **atelier de service** pour les files et actions quotidiennes.
- Un shell commun cohérent (navigation latérale fixe sur grand écran, navigation compacte sur mobile, barre supérieure avec contexte et session), mais quatre pages d’accueil propres ; le shell ne sert pas à simplement envelopper l’ancien rendu.
- ADMIN : cockpit d’opérations, KPI réels sur une rangée adaptée à la largeur, grille de visualisations et file récente.
- MANAGER : supervision des affectations, urgences, retards calculés selon règles explicites, rapports en attente, évaluations et suivi des paiements autorisés.
- AGENT : espace personnel limité aux enregistrements associés à son identité, actions d’intervention et progression.
- VIEWER : consultation en lecture seule, filtres, indicateurs, visualisations et accès aux tickets/rapports autorisés.
- Distinguer visuellement les rôles par accent, navigation et densité de contenu, tout en préservant une identité produit commune.
- Responsive, focus clavier visible, états vides/erreur explicites, motion réduite selon préférence système.

## Architecture et navigation

- `Dashboard.tsx` conserve l’état partagé des filtres globaux, mais délègue sa zone de contenu à quatre compositions dédiées. `AdminHome.tsx` ne doit plus rendre `Overview.tsx` comme son contenu principal.
- Le shell expose des menus adaptés au rôle, mais les liens ne sont qu’une couche d’expérience : chaque page, Server Action et Route Handler vérifie aussi la session et le rôle.
- Les sections de navigation doivent devenir de vraies routes lorsque leur contenu est une page fonctionnelle (tickets, utilisateurs, rapports, évaluations, paiements). Les ancrages restent adaptés aux sections d’un dashboard d’accueil.
- Conserver les pages de détail tickets et d’administration existantes ; les relier au nouveau shell sans régression de leurs garde-fous.
- Aucun stockage backend pour préférences globales ou organisationnelles : toute entrée « paramètres » reste informative ou locale au navigateur et ne prétend pas sauvegarder au serveur.

## Capacités : état actuel, développement réel, limites

| Domaine | Existe déjà | Développement de cette refonte | Indisponible / limite |
|---|---|---|---|
| Auth et rôles | Sessions signées, vérification d’utilisateur actif, rôles `admin`, `manager`, `agent`, `viewer` | Intégration systématique des règles aux pages/actions/API et tests directs des refus | Aucun contournement du proxy ou des contrôles serveur |
| Tickets | Liste/loader MySQL, détail, création, modification, commentaires et historique | Pages de file/recherche adaptées au rôle ; filtrage serveur de l’agent ; liens/navigation cohérents ; lecture seule pour VIEWER | Pas de nouvelles données source ni de suppression dans l’expérience standard |
| Admin utilisateurs | Page `/admin`, API liste/création/édition/activation/suppression, garde-fous dernier ADMIN | Page sous shell ADMIN, liste/états/erreurs/chargement intégrés | Le rôle ADMIN reste le seul gestionnaire de comptes |
| Comptes rendus | Table `intervention_reports`, API GET/POST par ticket, formulaire `ReportForm` | Boîte de réception MANAGER des rapports soumis ; historique et formulaire lié au ticket pour AGENT | Pas de rapport agrégé ou exportable sans implémentation/API supplémentaire |
| Évaluations | Table, API GET/POST par ticket, décisions validée/à corriger/rejetée, formulaire existant ; GET actuel réservé ADMIN/MANAGER | File ADMIN/MANAGER des rapports à évaluer ; GET scoped AGENT par `agentId = session.email` à ajouter pour affichage personnel ; formulaire d’évaluation réservé ADMIN/MANAGER | VIEWER n’accède pas aux évaluations ; aucun classement ou score synthétique inventé |
| Paiements | Table, API GET/POST par ticket réservées ADMIN/MANAGER, montants prévus/payés/solde et formulaire par ticket | Vue et saisie MANAGER/ADMIN uniquement, avec enregistrements existants | AGENT et VIEWER n’accèdent pas aux paiements dans cette version ; aucun virement, génération comptable ou validation distincte non implémentés |
| Charge et équipes | `tickets.assignee` contient le responsable libre ; aucun modèle d’équipe | Agrégation honnête par valeur d’assignation existante, « non assigné » séparé | Aucun organigramme, disponibilité, capacité ou équipe fictifs |
| Gmail | Staging et synchronisation manuelle réservés à ADMIN/MANAGER | Lien/navigation et statut de sync dans les espaces autorisés | Pas de Gmail pour AGENT/VIEWER ; aucune synchro simulée |
| Paramètres | Aucun modèle d’organisation/préférences serveur | Écran informatif de profil/session et préférences visuelles locales si utile | Pas de persistance backend ; aucun réglage présenté comme sauvegardé |

## État visuel actuel et transformation obligatoire

- Les composants `AdminHome`, `ManagerHome`, `AgentHome`, `ViewerHome`, `Sidebar` existent déjà dans le HEAD courant. La première passe Admin importe `Overview.tsx` en entier ; elle ne satisfait donc pas l’objectif de refonte et sera remplacée.
- `Dashboard.tsx` rend encore un header générique, des filtres globaux communs et les mêmes sections Suivi/Analyse pour tous les rôles. Le nouveau travail remplace cette composition par un shell explicite et des routes métier role-aware ; il ne se limite pas à changer les couleurs.
- Le shell peut être partagé comme structure d’application, mais le contenu principal, l’ordre des tâches, les KPI, les tables et les actions doivent diverger par rôle. Chaque accueil aura une composition indépendante et une navigation métier cohérente.
- Les captures demandées doivent montrer ces différences structurelles ; une capture ne montrant que le shell commun n’est pas un critère d’acceptation.

## Permissions existantes à corriger avant d’exposer de nouveaux écrans

- Les Route Handlers tickets création, modification et suppression ont des contrôles de rôle, mais le Server Action `updateTicket` du détail autorise actuellement le rôle VIEWER par sa condition de garde. `addComment` partage cette anomalie. Ces Server Actions doivent refuser VIEWER explicitement même si les champs sont disabled dans le navigateur.
- L’API détail `GET /api/tickets/[id]` et l’historique acceptent toute session ; les nouvelles pages agent doivent vérifier l’assignation côté serveur et ne jamais compter sur le filtre client actuel.
- `GET /api/tickets/[id]/reports` récupère les rapports du ticket avant de filtrer les lignes agent côté JS. La nouvelle logique devra appliquer owner/status dans SQL avant de sérialiser la réponse. VIEWER pourra lire uniquement les rapports validés.
- `GET /api/evaluations` et `GET /api/payments` sont actuellement ADMIN/MANAGER et principalement par ticket ; les POST sont ADMIN/MANAGER. L’accès personnel AGENT aux évaluations est un nouveau GET scindé et filtré par identité. Aucun droit AGENT de paiement ne sera ajouté dans cette conception.
- La table `tickets.assignee` contient des identifiants texte historiques ; l’accès agent exige une correspondance exacte avec l’e-mail de session après normalisation. Les tickets sans assignation et les valeurs au nom non vérifiable ne doivent pas apparaître dans l’espace agent.

## Autorisations et périmètre des données

- **ADMIN :** tableaux de bord globaux, toutes les files, utilisateurs, rapports, évaluations et paiements selon les API existantes ; peut créer/modifier les comptes.
- **MANAGER :** supervision globale des tickets, rapports, évaluations, paiements et Gmail conformément aux handlers existants ; aucune gestion des comptes. Les formulaires de rapports agent restent indisponibles pour MANAGER puisque `canWrite` ne l’autorise pas ; Manager valide/rejette via évaluation.
- **AGENT :** créer et modifier les tickets autorisés, commentaires et rapports d’intervention ; lire ses affectations et ses propres évaluations uniquement après ajout d’un GET scoped. L’API actuelle n’autorise pas les paiements AGENT ; cette refonte ne lui en accorde pas. Le filtrage doit être fait au serveur/SQL, jamais uniquement dans `Dashboard.tsx`.
- **VIEWER :** consultation des tickets, statistiques et rapports expressément autorisés en lecture seule ; aucune mutation, formulaire ni accès aux données financières personnelles non autorisé.
- Une action absente de l’API ou refusée par le rôle est masquée dans l’interface et reste protégée côté serveur.

## Flux et états UX

- Les pages serveur vérifient la session avant les requêtes métier.
- Chaque liste/page montre chargement, erreur récupérable et état vide distinct.
- Les formulaires affichent l’erreur API utile, désactivent la soumission en cours et revalident après succès.
- Les appels GET sont ciblés et peuvent être regroupés côté serveur par page ; aucune boucle client de chargement/polling n’est ajoutée.
- Ne pas exposer hashes, secrets Gmail ni données hors périmètre dans props client ou payloads API.

## Validation visuelle et fonctionnelle

- Capturer l’accueil de chaque rôle après authentification, en desktop et au minimum tablette/mobile ; comparer les structures (menus, sections principales, actions), pas seulement les couleurs.
- Tester routes directes et APIs sans session, avec VIEWER, AGENT, MANAGER et ADMIN ; refuser les accès croisés et vérifier les périmètres agent.
- Tester formulaires par validations en environnement de test non destructif ; ne jamais supprimer ou modifier les tickets/utilisateurs de production pour un test.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, scripts purs existants et E2E seulement si leur création/suppression de tickets est neutralisée via une base isolée ou un plan de test explicitement sans écriture sur les données protégées.
- Aucune migration, aucune modification/suppression/réinitialisation de données, aucun commit/push sans autorisation séparée.
