# Marketplace — interface V1

Interface React/Vite en français pour consulter et publier des annonces, gérer ses favoris et échanger avec les vendeurs.

## Démarrer en local

Depuis le dossier `frontend` :

```powershell
npm.cmd install
npm.cmd run dev
```

L’API attendue par défaut est `http://127.0.0.1:8000/api`.
Pour utiliser une autre API, définir `VITE_API_URL` dans `.env.local` puis redémarrer Vite.

```text
VITE_API_URL=http://127.0.0.1:8000/api
```

Le backend doit autoriser l’origine du frontend dans `CORS_ALLOWED_ORIGINS`.
Les instructions backend sont dans [backend/README.md](../backend/README.md).

## Vérifications

```powershell
npm.cmd test
npm.cmd run test:coverage
npm.cmd run lint
npm.cmd run build
```

Les tests vérifient le renouvellement concurrent des sessions, la rotation des tokens, les déconnexions, les erreurs réseau, les chemins de retour après connexion et la validation des images.

Les 23 tests incluent aussi la pagination et la fusion des messages lors d’un rafraîchissement. La commande de couverture impose au minimum 95 % des lignes, 80 % des branches et 90 % des fonctions sur les services JavaScript chargés par les tests. Elle ne mesure pas la couverture des composants React ni le rendu dans un navigateur.

Le lint refuse les avertissements. Les fournisseurs de contexte React, leurs valeurs et leurs hooks sont séparés pour conserver le rechargement à chaud sans avertissement.

Les contrôles automatiques et les limites de la couverture sont documentés dans [docs/tests-v1.md](../docs/tests-v1.md).

## Parcours finalisés

- Accueil basé sur les annonces réelles ; les chiffres fictifs et l’assistant IA de démonstration ont été retirés.
- Catalogue avec filtres, chargement, état vide, erreurs et nouvelle tentative.
- Pagination des annonces personnelles et favoris ; retirer un favori actualise la sélection.
- Création/modification avec plusieurs photos JPEG, PNG ou WebP, limitées à 5 Mo.
- En cas d’échec partiel des photos, l’annonce conserve son identifiant et seules les photos restantes sont renvoyées lors de la nouvelle tentative.
- La saisie de l’annonce est conservée dans la session du navigateur par utilisateur. Les fichiers non envoyés doivent être sélectionnés à nouveau après un rechargement.
- Les annonces masquées par la modération sont identifiées ; leur bouton de republication est retiré.
- Une session expirée revient à la page demandée après connexion. Les indisponibilités réseau ne sont pas présentées comme des identifiants incorrects.
- Les liens de réinitialisation invalides permettent de demander un nouveau lien ; le succès propose une connexion explicite.
- Navigation adaptée aux petits écrans, commandes de galerie accessibles au clavier, champs étiquetés, messages limités à 2 000 caractères et respect de la réduction des animations.

## Validation visuelle avant ouverture

La vérification dans un navigateur reste nécessaire sur ordinateur et mobile : voir [la grille de validation V1](../docs/validation-v1.md).

## Docker

Le Dockerfile construit les assets avec Node.js 24 puis les sert avec Nginx. Compose utilise `/api` sur la même origine que le frontend ; le fichier de développement `.env.local` est exclu du build. Depuis la racine, lancer `docker compose up --build -d --wait`, puis ouvrir `http://localhost:8080`. Voir [docs/docker.md](../docs/docker.md).

## Identité industrielle et carnet

L’accueil utilise une illustration SVG d’atelier originale, une palette anthracite/orange et une typographie forte. Les liens vers les villes et catégories réelles, la recherche et les filtres sont partageables dans l’URL du catalogue. Les mises en page s’adaptent au mobile et respectent la préférence de réduction des animations.

Le carnet public (`/carnet`) compare jusqu’à trois annonces. Seuls leurs identifiants sont conservés dans le stockage local de ce navigateur ; les informations sont rechargées depuis l’API à chaque ouverture. Une annonce supprimée ou inaccessible affiche un état indisponible. Le carnet ne réserve aucun article et reste distinct des favoris liés au compte. Si le stockage est bloqué, la sélection reste utilisable pendant la visite.
