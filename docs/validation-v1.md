# Validation des parcours V1

## Contrôles automatisés réalisés à l’étape 2

- Tests backend et tests de régression de la modération.
- Tests frontend : renouvellement de session concurrent, rotation des tokens, expiration, déconnexion pendant un renouvellement, protection des chemins de retour, images et erreurs.
- Compilation de production et lint du frontend.
- Commande `seed_categories` exécutée deux fois : ajout initial puis aucune modification.
- Parcours HTTP sur une base temporaire distincte de la base locale : 28 vérifications réussies, dont publication avec deux photos, fichier invalide, modification autorisée/interdite, favoris, messagerie de plus de neuf messages, profil, inscription, réinitialisation complète et CORS.

Les emails et images de la vérification HTTP sont stockés dans le répertoire temporaire de test. Aucun email n’est envoyé à une adresse réelle.

## Recette visuelle restant à effectuer

Aucun navigateur connecté n’était disponible pendant cette session. Les ajustements CSS et d’accessibilité ont été contrôlés dans le code et par compilation ; leur rendu n’a pas été validé visuellement.

Vérifier au minimum sur ordinateur (1 440 px), tablette (768 px) et mobile (320 et 390 px), ainsi qu’au clavier :

| Parcours | Résultat attendu |
| --- | --- |
| Accueil sans annonce | État vide et lien de publication, aucun chargement infini |
| Serveur indisponible | Message compréhensible et bouton Réessayer |
| Catalogue et filtres | Pas de débordement horizontal ; filtres utilisables ; prix invalides expliqués |
| Menu mobile | Ouverture/fermeture, touche Échap, liens accessibles et retour du focus |
| Connexion après une page protégée | Retour à la page demandée, avec ses paramètres |
| Connexion après expiration | Explication de l’expiration et retour au parcours |
| Inscription | Validation des confirmations ; email déjà utilisé clairement signalé |
| Publication avec plusieurs photos | Aperçus, retrait d’une photo, progression, annonce publiée une seule fois |
| Échec de la deuxième photo | Annonce conservée ; nouvelle tentative sur les photos restantes |
| Rechargement d’un formulaire | Saisie restaurée ; sélection des fichiers restants expliquée |
| Modification d’une annonce | Données/photos existantes, suppression confirmée et retour à la fiche |
| Annonce modérée | Statut compréhensible et absence de bouton Republier |
| Favoris et annonces personnelles | Deuxième page accessible ; liste actualisée après suppression/retrait |
| Fiche annonce | Galerie au clavier, description longue lisible et contact vendeur |
| Messagerie | Ouverture directe d’une ancienne conversation ; historique sans perte de position |
| Message long | Retour à la ligne sans déborder ; envoi vide bloqué |
| Profil | Aperçu de l’avatar, taille/type invalides expliqués, mise à jour visible |
| Mot de passe oublié | Confirmation sans révéler l’existence du compte |
| Lien reset invalide/expiré | Action Demander un nouveau lien |
| Reset réussi | Action Se connecter, sans redirection automatique prématurée |
| Couleurs sombres et animations réduites | Texte lisible et commandes visibles |

## Préparation d’un environnement neuf

Exécuter après les migrations :

```powershell
cd backend
.\venv\Scripts\python.exe manage.py seed_categories
```

Cette commande ajoute sept catégories générales et conserve les catégories déjà présentes.

## Limites de cette étape

L’envoi des emails réels, le stockage durable des images, l’hébergement, les sauvegardes et la surveillance relèvent des étapes de préparation et de déploiement. L’étape 2 ne déploie aucun service.
