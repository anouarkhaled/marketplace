# Tests et maintenance de la V1

## Résultats vérifiés le 15 octobre 2026

- 94 tests backend réussis sur SQLite et dans Docker avec PostgreSQL, avec l’ordre mélangé et la graine 112. Les trois tests supplémentaires vérifient la santé de la base ; les 91 tests de l’étape précédente avaient réussi avec la graine 902.
- 23 tests frontend réussis.
- Lint sans erreur ni avertissement et compilation frontend réussis.
- Dépendances Python cohérentes (`pip check`) et aucune migration manquante.
- Couverture des cinq services JavaScript exercés : 100 % des lignes, 96,67 % des branches et 100 % des fonctions.

Ce dernier chiffre concerne `api.js`, `collections.js`, `errors.js`, `forms.js` et `messages.js`. Il ne représente pas la couverture de toute l’interface : les hooks, composants React, `media.js` et interactions dans un navigateur ne sont pas inclus dans ce rapport.

## Matrice de régression

| Domaine | Scénarios couverts | Fichiers principaux |
| --- | --- | --- |
| Comptes | Inscription, email requis/normalisé/unique, doublon d’identifiant, mots de passe faibles ou similaires au compte, absence d’élévation de privilèges, profil privé et modification du seul compte courant | `backend/accounts/test_mvp.py`, `backend/accounts/test_regressions.py` |
| Sessions | Accès expiré refusé, renouvellement accepté et rotation du refresh, refresh expiré refusé, type de token incorrect, compte inactif, renouvellement concurrent, déconnexion pendant le renouvellement, erreurs réseau et retour à la destination après connexion | `backend/accounts/test_regressions.py`, `frontend/src/services/api.test.js` |
| Réinitialisation | Email et lien frontend utilisable, réponse identique pour compte connu/inconnu, token invalide/expiré/réutilisé, UID malformé, refus d’un mot de passe faible ou similaire, ancien mot de passe refusé après reset | `backend/accounts/tests.py`, `backend/accounts/test_regressions.py` |
| Annonces | Publication et propriétaire imposé par l’API, modification/suppression, refus des accès anonymes et tiers, masquage/modération, restauration admin, cascade des données liées, filtres et pagination | `backend/listings/tests.py`, `backend/listings/test_mvp.py`, `backend/listings/test_regressions.py` |
| Photos et avatars | Vraie image à exactement 5 Mo acceptée, 5 Mo + 1 octet refusés, fichier invalide, ajout/suppression refusés sans autorisation et taille contrôlée côté frontend | `backend/listings/test_mvp.py`, `backend/listings/test_regressions.py`, `backend/accounts/test_regressions.py`, `frontend/src/services/forms.test.js` |
| Favoris | Ajout/retrait, une seule relation par utilisateur/annonce, isolation entre comptes, absence d’authentification refusée, annonces inactives filtrées et pagination | `backend/favorites/test_mvp.py`, `backend/favorites/test_regressions.py` |
| Messagerie | Participants seulement, accès direct à une conversation, conversation réutilisée, expéditeur/discussion imposés par le serveur, limite de 2 000 caractères, messages lus uniquement sur la page consultée, pagination et égalité des dates | `backend/messaging/tests.py`, `backend/messaging/test_mvp.py`, `backend/messaging/test_regressions.py` |
| Actualisation des messages | Plus de neuf nouveaux messages, historique conservé, absence de doublons, mise à jour des accusés de lecture, ordre chronologique, erreur et annulation | `frontend/src/services/messages.test.js` |
| Parcours complet | Inscription vendeur → connexion → annonce avec deux photos → inscription acheteur → favori → contact → lecture/réponse du vendeur → lecture acheteur → annonce marquée vendue | `backend/accounts/test_journey.py` |
| Maintenance | Catégories initiales idempotentes, catégories existantes conservées, ordre stable de pagination et limites de tentatives | `backend/listings/test_regressions.py`, `backend/accounts/test_mvp.py` |

Le parcours complet utilise les endpoints publics, une base de test et de vrais tokens JWT, sans `force_authenticate`. Il s’agit d’un test d’intégration API ; il ne simule pas les clics dans l’interface.

## Lancer les contrôles en local

Python 3.14 et Node.js 24 sont utilisés par la CI et pour la validation locale.

Depuis `backend` :

```powershell
.\venv\Scripts\python.exe -m pip check
.\venv\Scripts\python.exe manage.py check --settings=config.test_settings
.\venv\Scripts\python.exe manage.py makemigrations --check --dry-run --settings=config.test_settings
.\venv\Scripts\python.exe manage.py test --settings=config.test_settings --shuffle
```

La configuration des tests fournit une clé de signature réservée aux tests ; aucune clé de production n’est nécessaire. Les validateurs de mot de passe et le hashage habituels restent actifs. Les uploads et les fichiers statiques de test sont temporaires, les emails restent en mémoire et le cache des nouveaux scénarios est réinitialisé entre les tests.

Reproduire un échec ou lancer un seul parcours :

```powershell
.\venv\Scripts\python.exe manage.py test --settings=config.test_settings --shuffle=902
.\venv\Scripts\python.exe manage.py test accounts.test_journey --settings=config.test_settings --verbosity=2
```

Depuis `frontend` :

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
```

`npm test` reste disponible sans rapport de couverture. Les nouveaux fichiers `*.test.js` sont découverts automatiquement. Les seuils de couverture des services exercés sont de 95 % des lignes, 80 % des branches et 90 % des fonctions ; un dépassement du seuil vers le bas fait échouer la commande.

## Intégration continue

Le workflow [V1 checks](../.github/workflows/ci.yml) se déclenche sur les push, les pull requests et manuellement. Il est prêt dans le dépôt local ; son exécution sur GitHub nécessite que ces fichiers soient commités et poussés.

Les jobs backend exécutent les mêmes tests sur SQLite et PostgreSQL 17, vérifient les dépendances et les migrations, puis créent un schéma neuf. Le job frontend utilise `npm ci`, refuse les avertissements de lint, applique les seuils de couverture et compile les assets de production. Le workflow n’effectue aucun déploiement et n’utilise aucun secret de production.

Les actions suivent les exemples officiels de [checkout](https://github.com/actions/checkout), [setup-python](https://github.com/actions/setup-python) et [setup-node](https://github.com/actions/setup-node).

La variante PostgreSQL a désormais été exécutée localement dans Docker : les 94 tests passent. Le premier passage du workflow distant sur GitHub Actions reste à vérifier. Un job Docker supplémentaire construit la stack, vérifie ses routes HTTP et exécute le parcours complet sur PostgreSQL. Voir [docker.md](docker.md). La recette visuelle ordinateur/mobile reste décrite dans [validation-v1.md](validation-v1.md).

## Défaut corrigé grâce aux tests

La validation des mots de passe appelait Django sans lui fournir le compte concerné. Un mot de passe identique au nom d’utilisateur pouvait donc être accepté à l’inscription et lors d’un reset. Les serializers fournissent maintenant le contexte utilisateur ; les deux cas sont protégés par des tests de régression.
