# Backend marketplace — stabilisation V1

## Vérification locale (PowerShell)

Utiliser l'environnement virtuel et fournir `SECRET_KEY` dans l'environnement.
Pour le développement local uniquement, `DEBUG=True` autorise la clé de développement.
Le fichier `.env` n'est pas automatiquement chargé par les settings actuels.

```powershell
cd backend
$env:DEBUG = "True"
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\venv\Scripts\python.exe manage.py test --settings=config.test_settings
.\venv\Scripts\python.exe manage.py migrate
```

## Règles stabilisées

- Les annonces inactives restent consultables par leur propriétaire et les administrateurs ; elles sont absentes du catalogue et des favoris publics/utilisateurs.
- Une annonce modérée ne peut être réactivée par son vendeur. La remise en ligne depuis l'administration efface le blocage de modération ; une annonce simplement désactivée par son vendeur peut être republiée par celui-ci.
- Les photos et avatars doivent être des images valides de 5 Mo maximum.
- Un ajout de photo ou de favori sur une annonce inexistante retourne 404.
- Les nouveaux comptes exigent une adresse email. L'inscription et le profil normalisent l'adresse en minuscules ; une contrainte en base empêche les doublons sans distinction de casse. Les comptes historiques sans email restent autorisés.
- La migration `accounts.0003_user_email_unique` vérifie les doublons existants et s'arrête sans modifier de compte si elle en trouve. Les doublons doivent être résolus avant de relancer la migration.
- Les limites par IP sont de 10 inscriptions/heure, 20 connexions/heure, 10 demandes de réinitialisation/heure et 20 confirmations/heure, en complément des limites globales. Le cache doit être partagé entre les instances lors de la préparation de la production.

## Contrat de pagination de la messagerie

Les endpoints conservent le format DRF `count`, `next`, `previous`, `results`, avec 9 éléments par page et le paramètre `page`.

- Les conversations sont ordonnées par date de création décroissante, puis identifiant décroissant.
- Les messages sont ordonnés par date de création décroissante, puis identifiant décroissant : la première page contient les messages les plus récents.
- Seuls les messages retournés par la page consultée sont marqués comme lus ; une page invalide ne modifie pas l'état de lecture.
- L'interface affiche les messages dans l'ordre chronologique, permet de charger l'historique et fusionne les rafraîchissements sans doublons.
- Le corps d'un message doit contenir de 1 à 2 000 caractères, hors espaces seuls.

Les tests de régression de cette étape sont dans les fichiers `test_mvp.py` des quatre applications.

## Compléments de l’interface V1

Exécuter `python manage.py seed_categories` après les migrations pour ajouter les sept catégories générales de départ. La commande peut être relancée et conserve les catégories existantes.

Les réponses d’annonces incluent `is_moderated` en lecture seule pour distinguer une annonce masquée par la modération d’une annonce désactivée par son vendeur.

`GET /api/conversations/<id>/` fournit les informations d’une conversation directement ouverte depuis un lien. Cet endpoint est réservé à ses participants ; les autres utilisateurs obtiennent 404.

Les messages de validation Django/DRF utilisent la langue française.

## Tests et intégration continue

La suite comporte 94 tests backend, dont les contrôles de santé de la base. Les nouveaux scénarios sont dans les fichiers `test_regressions.py` ; `accounts/test_journey.py` vérifie le parcours complet à deux utilisateurs avec de vrais JWT.

La configuration `config.test_settings` sélectionne une base SQLite en mémoire par défaut. Seule `TEST_DATABASE_URL` permet de sélectionner une autre base de test ; `DATABASE_URL` ne détermine pas la base utilisée pour ces vérifications. Les emails restent en mémoire et les uploads utilisent des répertoires temporaires.

Pour vérifier l’indépendance de l’ordre des tests :

```powershell
.\venv\Scripts\python.exe manage.py test --settings=config.test_settings --shuffle
```

La graine affichée permet de reproduire un échec avec `--shuffle=<graine>`.

Le workflow GitHub Actions vérifie SQLite et PostgreSQL, les migrations, les dépendances et les tests. Les commandes et la matrice détaillée sont dans [docs/tests-v1.md](../docs/tests-v1.md).

## Docker

Depuis la racine du dépôt, `docker compose up --build -d --wait` démarre PostgreSQL, Gunicorn et le frontend Nginx. Le backend applique les migrations, initialise les catégories et collecte les fichiers statiques au démarrage. Voir [docs/docker.md](../docs/docker.md).
