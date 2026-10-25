## License
   © 2026 Elhabchi Mohammed. All Rights Reserved.

# WellMind

Plateforme de retours collaborateurs et d'amélioration du cadre de travail, construite avec MongoDB, Express, React et Node.js. WellMind collecte des retours structurés, protège les réponses anonymes, calcule des statistiques vérifiables et aide les équipes RH à transformer les constats en actions.

> WellMind mesure des expériences de travail collectives. Ce n'est ni un outil de diagnostic médical, ni un outil d'évaluation individuelle.

## Fonctionnalités

- Espaces distincts pour les administrateurs RH et les collaborateurs, avec authentification et isolation par organisation.
- Gestion des comptes collaborateurs et des sondages (brouillons, publication, clôture, échelles, choix multiples et commentaires).
- Participation contrôlée (dates, questions obligatoires, une réponse par personne) et séparation des participations et des réponses anonymes.
- Tableau de bord et résultats agrégés protégés par un seuil minimal configurable (5 réponses par défaut).
- Analyse de commentaires par Gemini côté serveur, seulement après vérification du seuil et masquage des coordonnées personnelles.
- Actions d'amélioration avec responsable, échéance, statut et notes de suivi.
- Parcours de démonstration alimenté par le script de données d'exemple.

## Prérequis

- Node.js 20 ou ultérieur et npm.
- MongoDB local ou une URI MongoDB accessible.
- Une clé Gemini facultative pour l'analyse IA.

## Installation et lancement local

1. Installer les dépendances à la racine : `npm install`.
2. Copier `server/.env.example` vers `server/.env` et configurer `MONGODB_URI` et `JWT_SECRET`.
3. Charger les données fictives : `npm run seed`.
4. Lancer l'API et l'interface : `npm run dev`.
5. Ouvrir l'adresse Vite affichée dans le terminal (par défaut `http://localhost:5173`).



L'API est disponible sur `http://localhost:4000/api`. `VITE_API_URL` permet de modifier cette adresse. Sans `GEMINI_API_KEY`, l'analyse IA retourne une erreur explicite ; les sondages, les statistiques et les actions restent disponibles.

## Vérification

- `npm test` exécute les tests de règles métier et de confidentialité.
- `npm run build` vérifie la compilation de l'interface.

## Confidentialité et configuration

Les réponses à un sondage anonyme ne contiennent pas d'identifiant de collaborateur. Un document distinct suit la participation afin de prévenir les doublons. Les interfaces RH ne donnent accès qu'aux résultats agrégés ; les résultats détaillés et l'analyse IA sont supprimés sous le seuil de l'organisation. Le seuil peut être ajusté dans les paramètres de l'organisation. Les commentaires ne sont jamais envoyés à Gemini avant leur dé-identification.

Les données de démonstration sont entièrement fictives. Utilisez un `JWT_SECRET` long, une base MongoDB protégée et une clé Gemini stockée dans l'environnement du serveur lorsque vous configurez votre propre instance.
