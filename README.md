# Esport Fantasy League

Bienvenue sur le repository du projet **Esport Fantasy League**. 

## 🎯 Vision du Projet
Créer une plateforme de Fantasy League interactive et performante, avec une gestion de données en temps réel pour suivre les performances des joueurs pros.

## 🛠 Stack Technique
Le projet suit une architecture de type monorepo comprenant les briques suivantes :
- **Base de données** : PostgreSQL (via Docker)
- **Backend** : NestJS avec Prisma ORM
- **Frontend** : Vite (React/TypeScript)

> 📖 **Pour en savoir plus sur le fonctionnement interne** (modèle de BDD, cycle de vie métier, ingestion de données), consulte le document [Architecture & Métier](docs/ARCHITECTURE.md) pour un aperçu rapide.

## 🚀 Démarrage Rapide (Local)

### 1. Base de données
Le projet inclut un fichier `docker-compose.yml` à la racine pour instancier rapidement la base de données.
```bash
docker-compose up -d
```

### 2. Backend
Prérequis : Node.js installé.
```bash
cd backend
npm install
# Générer le client Prisma et pousser le schéma en DB (si nécessaire)
npx prisma generate
npx prisma db push
# Lancer le serveur en mode développement
npm run start:dev
```

### 3. Frontend
Dans un nouveau terminal :
```bash
cd frontend
npm install
npm run dev
```

## 🌍 Hébergement & Déploiement

L'architecture étant découpée entre un backend (NestJS + Postgres) et un frontend (React), plusieurs options de déploiement sont envisageables. Actuellement, la stratégie est la suivante :
- **Frontend** : Hébergement sur Vercel, avec déploiement continu branché sur le dépôt GitHub.
- **Backend & Base de données** : Auto-hébergement, en utilisant Docker pour encapsuler l'application NestJS et la base de données PostgreSQL. Github actions pour assurer le build et le déploiement sur le serveur VPS.

### GitHub Actions

Le dépôt utilise deux workflows, limités au backend :
- **CI** : exécute le build du backend sur les branches `main` et `dev`.
- **CD** : s'exécute sur un runner auto-hébergé installé sur le VPS et déploie automatiquement le backend à chaque push sur `main`.

Le frontend est déployé séparément sur Vercel et ne fait pas partie de ce pipeline GitHub Actions.

Secrets attendus pour le runner de production :
- `ESFL_DB_USER`
- `ESFL_DB_PASSWORD`
- `ESFL_DB_NAME`
- `BACKEND_PORT`
- `BACKEND_DATABASE_URL`
- `BACKEND_JWT_SECRET`
- `BACKEND_GOOGLE_CLIENT_ID`
- `BACKEND_GOOGLE_CLIENT_SECRET`
- `BACKEND_GOOGLE_CALLBACK_URL`
- `BACKEND_FRONTEND_URL`
- `BACKEND_PANDASCORE_API_TOKEN`

Le runner doit avoir Docker et Docker Compose disponibles localement.

## 📜 Conventions & Git Flow

L'organisation du dépôt suit une version simplifiée du Gitflow, adaptée pour un développeur solo, afin de garantir que la version en production soit toujours stable.

1. **Branches** :
   - `main` : Reflète l'environnement de production. Le code ici doit toujours être fonctionnel et déployable.
   - `dev` : Branche de développement continu. C'est ici que le code est poussé au quotidien avant d'être réuni dans une release.
   - `feature/...` : Pour les développements conséquents ou expérimentaux, partagés depuis `dev` et mergés dans `dev` une fois terminés.

2. **Commits** :
   L'historique suit les conventions **Conventional Commits** :
   - `feat:` : Ajout de fonctionnalité
   - `fix:` : Correction de bug
   - `refactor:` : Refactorisation
   - `docs:` : Mise à jour de la documentation
   - `chore:` : Tâches de maintenance (dépendances, outils, etc.)

3. **Qualité** :
   Des outils de linting et de formatage sont en place (`.prettierrc` côté backend, `.oxlintrc.json` côté frontend).
