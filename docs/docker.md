# Docker setup

## Services

| Service | Role | Published port |
| --- | --- | --- |
| `frontend` | Multi-stage Node build followed by Nginx serving React and proxying Django | `127.0.0.1:8080` by default |
| `backend` | Python 3.14, Django and Gunicorn, running as a non-root user | Internal port 8000 only |
| `db` | PostgreSQL 17 with a readiness check | Internal port 5432 only |

The browser uses `/api` on the same origin as the frontend. Nginx also routes `/admin/` and `/health/` to Django, serves `/static/` and `/media/` from shared volumes, and falls back to `index.html` for React routes such as `/annonce/12`.

The backend starts after PostgreSQL becomes healthy; the frontend starts after the backend becomes healthy. This uses Compose’s documented [health-based startup dependencies](https://docs.docker.com/compose/how-tos/startup-order/).

## First start

Docker Desktop must be running with Linux containers. From the repository root:

```sh
docker compose up --build -d --wait
docker compose ps
```

Visit `http://localhost:8080` and create an admin account if needed:

```sh
docker compose exec backend python manage.py createsuperuser
```

On each normal backend start the entrypoint runs migrations, seeds the initial categories without replacing existing ones, and collects static assets. The entrypoint skips those startup commands when another command is supplied, allowing test and management commands to run independently.

## Configuration

The defaults work without an environment file. For local customization, copy `.env.example` to `.env` in the repository root:

```powershell
Copy-Item .env.example .env
```

On Linux/macOS:

```sh
cp .env.example .env
```

| Variable | Default / purpose |
| --- | --- |
| `APP_PORT` | `8080`; also updates the default frontend URL and trusted origins |
| `POSTGRES_DB` | `marketplace` |
| `POSTGRES_USER` | `marketplace` |
| `POSTGRES_PASSWORD` | Local-only default; use a hexadecimal or alphanumeric password because it is embedded in the database URL |
| `DJANGO_SECRET_KEY` | Local-only default; replace for deployment |
| `COOKIE_SECURE` | `False` for local HTTP admin login; set `True` for HTTPS |
| `FRONTEND_URL` | Defaults to `http://localhost:<APP_PORT>`; used in password-reset emails |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1,backend`; add your domain for external hosting |
| `CSRF_TRUSTED_ORIGINS` | Defaults to local origins on `APP_PORT` |
| `CORS_ALLOWED_ORIGINS` | Defaults to local origins on `APP_PORT` |
| `EMAIL_BACKEND` | Console backend; password-reset emails appear in backend logs |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | SMTP settings when using the SMTP email backend |
| `DEFAULT_FROM_EMAIL` | Sender address for password-reset messages |

For example, changing only `APP_PORT=8090` makes the app available at `http://localhost:8090` without rebuilding the frontend for a different API origin.

The frontend uses `/api` at image build time. Neither the host’s `frontend/.env.local` nor any backend environment file is copied into an image. Root `.env` variables are provided to the containers by Compose.

## Data and restarts

Named volumes retain PostgreSQL data, user uploads and collected static files. The local `backend/db.sqlite3` and `backend/media` are not copied into these volumes.

```sh
docker compose down
docker compose up -d --wait
```

These commands preserve data. `docker compose down -v` is a separate destructive operation that deletes the stack’s named volumes, including the database and uploaded images.

After source changes, rebuild:

```sh
docker compose up --build -d --wait
```

Changing the database password in `.env` does not change the password already stored in an initialized PostgreSQL volume. Existing databases require a deliberate credential change rather than merely editing the environment file.

## Checks and tests

Validated locally: both images build, all three services become healthy, `nginx -t` succeeds, and all 94 backend tests pass inside Docker against a separate PostgreSQL test database. HTTP checks also cover React deep links, the API, admin login and its CSRF cookie, admin CSS, JavaScript assets, and missing-image 404 responses. The 94-test SQLite suite passes as well.

The first image build downloads the base images and dependencies; later builds reuse Docker’s cache.

Validate the Compose file without starting containers:

```sh
docker compose config --quiet
```

Check the HTTP entrypoint:

```sh
curl -f http://localhost:8080/health/
```

Run the backend suite against an isolated in-memory test database inside the backend image:

```sh
docker compose exec backend python manage.py test --settings=config.test_settings --shuffle
```

To run it against a separate PostgreSQL test database in the Compose database service:

```sh
docker compose exec -e TEST_DATABASE_URL=postgresql://marketplace:marketplace-local-only@db:5432/marketplace backend python manage.py test --settings=config.test_settings --shuffle
```

Adapt the test URL if credentials were customized. Django creates and removes a separate test database; this command does not use the app’s tables for test records.

Frontend tests and lint are run from the source checkout as documented in [tests-v1.md](tests-v1.md); the runtime frontend image contains Nginx and built assets, not Node.js.

The GitHub Actions Docker job builds and starts this same stack, checks its HTTP routes and Nginx configuration, and runs the complete API journey using PostgreSQL.

## Troubleshooting

- If the Docker engine cannot be reached, start Docker Desktop before running Compose.
- If the web port is occupied, set a different `APP_PORT` in root `.env`.
- Inspect startup errors with `docker compose logs backend db`; failed migrations stop backend startup rather than starting against an incomplete schema.
- The root `.env` is optional, and is separate from the backend and frontend development environment files.

This stack runs locally over HTTP with one Gunicorn worker and four threads. Public deployment needs domain/TLS configuration, private credentials, email delivery and backups. If increasing the worker or replica count, configure a shared throttle cache as part of that deployment.
