# Architecture & Métier : Coup d'œil Rapide

Cette documentation offre une vision d'ensemble du fonctionnement interne du projet **Esport Fantasy League**, pour comprendre en quelques minutes comment les briques interagissent.

## 🔄 Le Cycle de Vie d'une Fantasy League

Le cœur de l'application s'articule autour d'une boucle fonctionnelle bien précise, gérée par les différents modules du backend (NestJS) :

1. **Ingestion des Données (`IngestionModule`)** : Le backend se connecte régulièrement à des API externes (ex: Pandascore) pour récupérer les matchs e-sport réels à venir (`MatchDays`), les équipes et les joueurs professionnels (`ProPlayers`).
2. **Création & Rejoindre une Ligue (`LeaguesModule`)** : Les utilisateurs créent des ligues privées/publiques et s'y affrontent.
3. **Draft / Création de Roster (`RostersModule`)** : Avant qu'un `MatchDay` ne commence, chaque utilisateur sélectionne ses joueurs pros pour former son équipe (`Roster`).
4. **Verrouillage** : Dès que les matchs réels commencent, le `MatchDay` passe en statut `LOCKED`. Les rosters ne peuvent plus être modifiés.
5. **Récupération des Scores (`ScoringModule` + `IngestionModule`)** : Les matchs se terminent dans la vie réelle. Le système ingère les statistiques (`DayPerformances`) des joueurs.
6. **Calcul des Points (`ScoringModule`)** : Les points de fantasy sont calculés en fonction des performances réelles des joueurs pros choisis dans les rosters. Le classement des ligues est mis à jour.

## 🗄 Modèle de Données (Base de Données)

La base de données relationnelle (PostgreSQL gérée avec Prisma) est structurée autour de plusieurs pôles majeurs :

### 👤 Utilisateurs & Ligues
- **`User`** : Les joueurs de notre application.
- **`League`** : L'instance d'une ligue (paramètres de jeu, taille du roster, etc.).
- **`LeagueMember`** : L'association d'un User à une League, qui stocke également le score global de l'utilisateur dans cette ligue.

### 🎮 Données Esport Réelles
- **`Team` & `ProPlayer`** : Les équipes réelles et leurs joueurs professionnels respectifs.
- **`MatchDay` & `Match`** : Un rassemblement de matchs réels se déroulant sur une période donnée (ex: une semaine de LEC sur League of Legends).
- **`DayPerformance`** : Les statistiques générées par un joueur pro lors d'un `MatchDay`.

### 📋 Fantasy & Gameplay
- **`Roster`** : L'équipe sélectionnée par un utilisateur pour un `MatchDay` spécifique au sein d'une `League`.
- **`RosterPick`** : Le détail des joueurs choisis dans un Roster.

### 🛡 Sécurité
- **`AuditLog`** : Une table en "Insert-only" pour garder une trace de toutes les actions critiques des utilisateurs (rejoindre une ligue, changer son roster, etc.).

## 🧩 Modules Clés du Backend

Le backend est découpé logiquement pour garder la base de code propre :
- `AuthModule` / `UsersModule` : Authentification (JWT/Google OAuth) et gestion des profils.
- `LeaguesModule` : Gestion du cycle de vie des ligues.
- `MatchDaysModule` / `ProPlayersModule` : Exposition des données e-sport pour le frontend.
- `RostersModule` : Logique de validation métier complexe (vérification que l'utilisateur peut choisir tel ou tel joueur selon les règles de sa ligue).
- `IngestionModule` : Les crons et services permettant d'absorber les données des API tierces.
- `ScoringModule` : L'algorithme de calcul de points.

---
*Ce document sert de référence rapide pour quiconque souhaite comprendre "comment ça marche sous le capot" avant de plonger dans le code.*
