# Marketplace

Application de petites annonces full-stack (façon Leboncoin) : publier, rechercher et gérer des annonces avec authentification, favoris et upload d'images — API Django REST + interface React.

## Fonctionnalités

- **Authentification JWT** (inscription/connexion) avec utilisateur personnalisé (téléphone, avatar) — rafraîchissement automatique du token côté frontend : une requête qui échoue en 401 déclenche un `refresh` puis se rejoue automatiquement, sans que l'utilisateur ait à se reconnecter.
- **Annonces** : titre, description, prix, localisation, catégorie, plusieurs images par annonce.
- **Recherche & filtres** : prix min/max, localisation, catégorie, type de bien (`django-filter`), pagination (9 annonces/page).
- **Favoris** : ajouter/retirer une annonce, contrainte d'unicité côté base de données (pas de doublon).
- **Tableau de bord** utilisateur : mes annonces, profil.
- **Champs de modération** sur les annonces (`moderated_at`, `moderation_reason`) — prêts pour un futur back-office de modération, pas encore exploités côté UI.

## Architecture

```
marketplace/
├── backend/                # Django REST Framework
│   ├── accounts/           # Utilisateur custom (AbstractUser + phone + avatar), JWT
│   ├── listings/           # Category, Listing, ListingImage, filtres, permissions
│   ├── favorites/          # Liaison user <-> annonce favorite
│   └── config/             # settings, urls, wsgi/asgi
└── frontend/                # React 19 + Vite
    └── src/
        ├── pages/          # Register, Login, Listings, ListingDetail, CreateListing, MyListings, Favorites, Profile, Dashboard
        ├── context/        # AuthContext
        └── services/       # Appels API (axios) + intercepteur de refresh token
```

## Stack

**Backend** : Django · Django REST Framework · SimpleJWT · django-filter · django-cors-headers · whitenoise (fichiers statiques) · dj-database-url

**Frontend** : React 19 · Vite · React Router · Axios

## Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # ou: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Variables d'environnement utiles (`.env`) : `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Par défaut le frontend appelle l'API sur `http://127.0.0.1:8000/api` (configurable via `VITE_API_URL`).

### Déploiement

`backend/build.sh` (install + `collectstatic` + `migrate`) est prêt pour une plateforme type Render : fichiers statiques servis par whitenoise, base de données configurable via `DATABASE_URL` (`dj-database-url`).

## Limites actuelles

- Pas de tests automatisés (les fichiers `tests.py` de chaque app Django sont vides).
- Les champs de modération existent en base mais aucune interface (admin mis à part) ne les exploite encore.

## Ce que j'ai appris

- `ALLOWED_HOSTS` était lu depuis l'environnement puis écrasé par une liste vide laissée par le template `django-admin startproject` — un rappel que les settings générés automatiquement méritent une relecture ligne par ligne avant un déploiement, pas juste un remplissage des `TODO` évidents.
- Gérer le refresh JWT côté frontend avec un intercepteur Axios (au lieu de déconnecter l'utilisateur au premier 401) demande de faire attention à ne rejouer la requête d'origine qu'une seule fois (flag `_retry`) pour éviter une boucle infinie si le refresh échoue aussi.
- Séparer clairement les apps Django par domaine (`accounts`, `listings`, `favorites`) plutôt que tout mettre dans une seule app rend chaque partie plus facile à faire évoluer indépendamment (ex: ajouter la modération sans toucher aux favoris).
- Prévoir des champs de modération dès le modèle de données (même sans UI immédiate) évite une migration douloureuse plus tard si cette fonctionnalité devient nécessaire.
