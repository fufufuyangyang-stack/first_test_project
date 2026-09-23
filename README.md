# Pixshelf

A multi-user picture sharing prototype. Users sign up, upload pictures, and get a public homepage at `/u/<username>`. Anyone can search for users and download public pictures.

- **Backend:** Django + Django REST Framework, JWT auth (`backend/`)
- **Frontend:** React (Vite) + React Router + TanStack Query (`frontend/`)

## Run locally

Backend (http://127.0.0.1:8000):

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver
```

Frontend (http://localhost:5173). Vite proxies `/api` and `/media` to Django:

```bash
cd frontend
npm install
npm run dev
```

Optional: `.venv/bin/python manage.py createsuperuser` for the Django admin at `/admin/`.

## Tests

```bash
cd backend && .venv/bin/python manage.py test
```

## API

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register/` | — | Create account |
| POST | `/api/auth/login/` | — | Get `access` + `refresh` tokens |
| POST | `/api/auth/refresh/` | — | New access token |
| GET/PATCH | `/api/me/` | required | Own profile (bio, avatar) |
| GET | `/api/users/?search=` | — | Search users by username |
| GET | `/api/users/<username>/` | — | Public profile |
| GET | `/api/users/<username>/pictures/` | — | Public pictures (+ private ones for the owner) |
| POST | `/api/pictures/` | required | Upload (multipart: `image`, `title`, `description`, `is_public`) |
| GET/PATCH/DELETE | `/api/pictures/<id>/` | owner for writes | Picture detail |
| GET | `/api/pictures/<id>/download/` | — | Original file as an attachment |

Uploads are checked with Pillow (JPEG/PNG/WebP/GIF, max 10 MB), re-encoded to strip EXIF/GPS metadata, renamed to random filenames, and given a 400px WebP thumbnail.

## Known prototype limitations

- JWTs are stored in `localStorage`. Before production, move the refresh token to an httpOnly cookie.
- Media files are served straight from `/media/`. A private picture's API endpoints return 404 to other users, but anyone who has the file's (random) URL can still open it. Protect media URLs (e.g. signed S3 URLs) before relying on privacy.
- Uses SQLite and local disk storage with `DEBUG=True` and the generated `SECRET_KEY`. Production needs PostgreSQL, S3-style storage (`django-storages`), and real settings from environment variables.
