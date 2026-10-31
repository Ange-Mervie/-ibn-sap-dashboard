# Product

## Register

product

## Users

Les équipes internes d’IBN Group SARL utilisent l’application depuis un poste de travail pour suivre les incidents SAP et les interventions. Les profils sont ADMIN, MANAGER, AGENT et VIEWER ; l’application exige une authentification.

## Product Purpose

L’application rassemble le suivi des tickets SAP et les workflows d’intervention, de validation, d’évaluation et de paiement autorisés. Elle doit rendre immédiatement visibles les tâches pertinentes pour le rôle connecté, préserver la traçabilité et présenter les données MySQL sans inventer d’indicateurs.

## Brand Personality

Professionnelle, claire et fiable. L’interface doit favoriser une lecture rapide et la confiance dans les données et permissions.

## Anti-references

- Une page unique identique pour tous les rôles, avec seulement un titre ou quelques boutons masqués.
- Un ancien écran Overview simplement placé dans un nouveau shell sans refonte de sa composition.
- Des statistiques, équipes, paramètres enregistrables ou workflows simulés qui ne reposent pas sur des données/API existantes.
- Des contrôles d’accès uniquement visuels, sans vérification serveur.

## Design Principles

- Chaque rôle obtient une hiérarchie, une navigation et des actions conçues pour son travail réel.
- Distinguer visuellement les listes de travail, les indicateurs, l’activité et les opérations sensibles.
- Réutiliser les données et services existants ; toute donnée absente reste explicitement indisponible.
- Faire respecter l’autorisation côté serveur et appliquer le périmètre d’un agent sur les requêtes de données, pas seulement dans le navigateur.
- Préserver les données historiques et la traçabilité lors de chaque évolution.

## Accessibility & Inclusion

Aucune exigence particulière supplémentaire n’a été communiquée. Viser une navigation clavier, des libellés accessibles, des contrastes adaptés, des états de focus visibles, des tableaux utilisables en responsive et le respect de `prefers-reduced-motion`.
