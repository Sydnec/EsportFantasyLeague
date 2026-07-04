# Guide de Workflow GIT : Bonnes Pratiques & Conventions

Ce document définit les règles et conventions de gestion des versions avec Git pour le projet **Esport Fantasy League**. L'objectif est de maintenir un historique propre, lisible et de faciliter le travail en équipe ou en solo.

---

## 🌿 1. Stratégie de Branches (Git Flow Light)

Nous utilisons une version simplifiée et robuste du Git Flow, articulée autour de deux branches permanentes et de branches éphémères pour les tâches.

```none
                  ┌── feature/auth ──┐
                  │                  │
── dev ───────────┴──────────────────┴───[Intégration]───
   │                                      │
   └─────────── (Release) ────────────────┼───┐
                                          │   │
── main ──────────────────────────────────v───┴───[Production (Stable)]──
```

### Branches Permanentes

- **`main`** : Contient uniquement le code stable et prêt pour la production. C'est l'image exacte de ce qui est déployé sur le serveur principal. Aucun push direct n'est autorisé.
- **`dev`** : C'est la branche principale de travail. Toutes les nouvelles fonctionnalités y sont fusionnées pour être testées et intégrées ensemble avant de partir en production.

### Branches Éphémères (Tâches)

Ces branches sont créées pour effectuer un travail précis et doivent être supprimées une fois fusionnées dans `dev`.

- **`feature/<nom-de-la-tache>`** (ou `feat/...`) : Pour le développement de nouvelles fonctionnalités (ex: `feature/rabbitmq-setup`).
- **`fix/<nom-du-bug>`** : Pour la correction de bugs découverts en développement (ex: `fix/jwt-expiration`).
- **`hotfix/<nom-du-bug-urgent>`** : Pour les corrections urgentes en production. Créée à partir de `main` et fusionnée dans `main` ET `dev` (ex: `hotfix/login-crash`).

---

## ✍️ 2. Convention de Messages de Commit (Conventional Commits)

Pour que l'historique reste lisible en un coup d'œil et permettre la génération automatique de changelogs, nous suivons la convention **Conventional Commits**.

### Format Standard

```text
type(scope): message court en français (ou anglais)
```

- **`type`** (Obligatoire) : La nature du changement (voir liste ci-dessous).
- **`scope`** (Optionnel) : Le module concerné (ex: `auth`, `leagues`, `esport-api`, `gateway`, `infra`).
- **`message`** (Obligatoire) : Description courte, au présent ou à l'impératif, commençant par une minuscule (ex: `ajoute la validation des scores`).

### Les Types de Commit

- `feat` : Ajout d'une nouvelle fonctionnalité (ex: `feat(roster): ajoute le capitaine d'équipe`).
- `fix` : Correction d'un bug (ex: `fix(auth): corrige la redirection google oauth`).
- `refactor` : Restructuration du code sans changement de comportement (ex: `refactor(db): scission du schema prisma`).
- `docs` : Mise à jour de la documentation (ex: `docs: ajoute le workflow git`).
- `chore` : Maintenance (mise à jour de dépendances, config eslint, dockerfile, etc.).
- `test` : Ajout ou correction de tests unitaires/d'intégration.

---

## 🔄 3. Cycle de Travail Typique d'une Feature

Voici les commandes Git exactes pour développer proprement une fonctionnalité étape par étape :

### Étape 1 : Se synchroniser et créer la branche de feature

On s'assure de partir d'un code `dev` à jour.

```bash
# Aller sur dev
git checkout dev

# Récupérer les derniers changements distants
git pull origin dev

# Créer et basculer sur la nouvelle branche de feature
git checkout -b feature/ma-super-feature
```

### Étape 2 : Coder et commiter localement

Faites des commits réguliers et ciblés. Évitez les gros commits qui mélangent plusieurs sujets.

```bash
# Ajouter les fichiers modifiés
git add .

# Enregistrer les modifications avec un message explicite
git commit -m "feat(league): ajoute la création de ligues privées"
```

### Étape 3 : Garder sa branche à jour avec `dev` (Rebase)

Pendant que vous codez, `dev` peut avoir évolué. Il faut intégrer ces changements sur votre branche pour éviter les conflits au moment du merge. Nous privilégions le `rebase` pour garder un historique linéaire.

```bash
# Aller sur dev et récupérer le travail des autres
git checkout dev
git pull origin dev

# Revenir sur sa branche et réappliquer ses commits par-dessus dev
git checkout feature/ma-super-feature
git rebase dev
```

_Si des conflits apparaissent, résolvez-les dans votre IDE, puis faites `git add <fichier>` et `git rebase --continue`._

### Étape 4 : Fusionner dans `dev`

Une fois le travail fini et testé localement :

```bash
# Aller sur dev
git checkout dev

# Fusionner la feature en forçant la création d'un commit de merge
# (cela permet de garder une trace visuelle du groupe de commits de la feature)
git merge --no-ff feature/ma-super-feature -m "chore: merge branch feature/ma-super-feature into dev"

# Pousser sur le dépôt distant
git push origin dev

# Supprimer la branche locale devenue inutile
git branch -d feature/ma-super-feature
```

---

## 💡 4. Règles d'or pour travailler proprement

1. **Une branche = Une tâche** : Ne mélangez pas une correction de bug et une nouvelle fonctionnalité sur la même branche.
2. **Ne commitez jamais de secrets** : Les fichiers `.env`, clés privées ou mots de passe doivent impérativement figurer dans le fichier `.gitignore`.
3. **Testez avant de merger** : Assurez-vous que votre code build localement et que les tests passent avant de fusionner dans `dev` ou d'ouvrir une Pull Request.
4. **Des commits atomiques** : Un commit doit représenter une seule unité logique de travail. Si vous devez écrire "et" dans votre titre de commit (ex: "ajoute X et corrige Y"), c'est que vous devriez faire deux commits distincts.
