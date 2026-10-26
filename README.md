# Marketplace

React frontend and Django REST API for listings, favorites and buyer/seller messaging.

## Run with Docker

Start Docker Desktop with Linux containers, then run from this directory:

```sh
docker compose up --build -d --wait
```

Open **http://localhost:8080**. The admin is at **http://localhost:8080/admin/**.

Create your administrator account interactively:

```sh
docker compose exec backend python manage.py createsuperuser
```

Migrations, initial categories and admin static files are prepared automatically at backend startup. PostgreSQL and uploaded images use named volumes. The Docker database starts separately from the existing local SQLite database.

The Compose defaults are for local HTTP use. To customize the port, credentials or email provider, copy `.env.example` to `.env` and edit it before starting. The root `.env` is read by Compose; the existing `backend/.env` and `frontend/.env.local` are excluded from image builds.

```sh
docker compose logs -f backend
docker compose ps
docker compose down
```

`docker compose down` keeps the database and uploads. See [the Docker guide](docs/docker.md) for configuration, tests and troubleshooting.

## Development and tests

- [Backend setup](backend/README.md)
- [Frontend setup](frontend/README.md)
- [Test commands and CI](docs/tests-v1.md)
- [Visual validation checklist](docs/validation-v1.md)
