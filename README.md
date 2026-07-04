# Esport Fantasy League

Bienvenue sur le dépôt du projet **Esport Fantasy League**. La plateforme a été conçue selon une architecture orientée microservices événementiels afin de garantir l'indépendance de mise en production et l'isolation des responsabilités.

---

## 🎯 Vision du Projet

Créer une plateforme de Fantasy League interactive et performante, avec une gestion de données en temps réel pour suivre les performances des joueurs pros sur plusieurs jeux esport (League of Legends, Counter-Strike, Rocket League, Valorant).

---

## 🛠️ Stack Technique & Architecture

Le projet suit une architecture de type monorepo découpée en plusieurs services autonomes :

1. **API Gateway** (`services/gateway`) : Point d'entrée unique (Port 3000) gérant le routage inverse vers les microservices et la validation initiale des jetons JWT.
2. **Backend Service** (`services/backend`) : Service central du gameplay (gestion des utilisateurs, authentification JWT/Google OAuth, création de ligues privées/publiques, drafts et composition des rosters).
3. **Esport Data Adapter Service** (`services/esport-adapter`) : Service d'ingestion hybride (Pandascore pour les plannings + API éditeurs spécialisées pour les statistiques détaillées).
4. **Scoring Service** (`services/scoring`) : Microservice asynchrone (stateless) calculant les scores de fantasy en fonction des formules propres à chaque jeu.
5. **Frontend** (`frontend`) : Application client développée en React (Vite / TypeScript).
6. **Base de données & Broker** : PostgreSQL (avec schémas logiques isolés par service) et RabbitMQ pour la communication événementielle asynchrone.

> 📖 **Pour en savoir plus sur la conception interne et les flux de données :**
>
> - Consultez le [openapi.yaml](docs/openapi.yaml) pour la spécification OpenAPI / Swagger complète des APIs.
> - Consultez le [MICROSERVICES_ARCHITECTURE.md](docs/MICROSERVICES_ARCHITECTURE.md) pour les contrats de messages et les schémas SQL.
> - Consultez le [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) pour les règles de commits et de branches.

---

## 🚀 Démarrage Rapide (Développement Local)

### 1. Démarrer les services d'infrastructure

Le projet contient un fichier `docker-compose.yml` à la racine permettant de lancer PostgreSQL et RabbitMQ en une seule commande :

```bash
docker compose up -d postgres rabbitmq
```

### 2. Configurer et lancer les services

Chaque microservice possède son propre dossier et ses propres variables d'environnement (`.env`).
Pour chaque service (`gateway`, `backend`, `esport-adapter`, `scoring`) :

```bash
cd services/<nom-du-service>
npm install

# (Uniquement pour backend et esport-adapter) Générer le client Prisma et pousser le schéma
npx prisma db push

# Lancer le serveur en mode développement
npm run start:dev
```

### 3. Lancer le Frontend

Dans un nouveau terminal :

```bash
cd frontend
npm install
npm run dev
```

---

## 🌍 Hébergement & Déploiement

- **Frontend** : Hébergement sur Vercel, avec déploiement continu branché sur la branche `main` du dépôt GitHub.
- **Microservices & Infrastructure** : Auto-hébergement géré par Docker Compose sur un serveur VPS, automatisé via GitHub Actions.

### Pipelines GitHub Actions

- **CI (Intégration Continue)** : S'exécute sur chaque push ou Pull Request sur `main` ou `dev`. Compile l'ensemble des 4 services en parallèle grâce à une stratégie de matrix GitHub Actions.
- **CD (Déploiement Continu)** : Déploie automatiquement les services sur le serveur VPS lors d'un push sur `main`.

### Liste des Secrets attendus pour le déploiement (Production)

Pour fonctionner, le runner auto-hébergé du VPS attend les secrets suivants configurés sur GitHub :

- **Global & DB** :
  - `ESFL_DB_USER` : Utilisateur de la base de données PostgreSQL.
  - `ESFL_DB_PASSWORD` : Mot de passe de la base de données PostgreSQL.
  - `ESFL_DB_NAME` : Nom physique de la base de données PostgreSQL.
  - `RABBITMQ_DEFAULT_USER` : Identifiant d'administration RabbitMQ.
  - `RABBITMQ_DEFAULT_PASS` : Mot de passe d'administration RabbitMQ.
- **Backend Service** :
  - `BACKEND_DATABASE_URL` : URL de connexion ciblant le schéma `backend_db`.
  - `BACKEND_JWT_SECRET` : Clé secrète de signature des tokens JWT.
  - `BACKEND_GOOGLE_CLIENT_ID` / `BACKEND_GOOGLE_CLIENT_SECRET` / `BACKEND_GOOGLE_CALLBACK_URL` : Identifiants Google OAuth.
  - `BACKEND_FRONTEND_URL` : URL de redirection finale du frontend.
  - `RABBITMQ_URL` : URL amqp de connexion au broker (ex: `amqp://user:pass@rabbitmq:5672`).
- **Esport Adapter Service** :
  - `ESPORT_DATABASE_URL` : URL de connexion ciblant le schéma `esport_db`.
  - `ESPORT_PANDASCORE_API_TOKEN` : Token de sécurité de l'API Pandascore.
