# WEXO Code Challenge

Movie discovery application split into two apps in one repository.

```text
WEXO-CODE-CHALLENGE/
├── frontend/     Angular application
├── backend/      Laravel application
├── docs/         Architecture and development notes
├── .gitignore
└── README.md
```

Framework files stay inside the application they belong to. The Git history stays at the repository root.

## Prerequisites

Frontend:

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`
- npm 11. `frontend/package.json` sets `packageManager` to `npm@11.19.1`.

Backend:

- Docker Desktop
- DDEV 1.25 or newer
- The DDEV web container provides PHP 8.4 and Composer 2. Laravel 13 requires PHP `^8.3`.

## Frontend

Install dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
cd frontend
npm start
```

`npm start` runs `ng serve` with the development configuration. The app is at `http://localhost:4200/` unless that port is already in use. Stop the server with `Ctrl+C`.

Production build:

```bash
cd frontend
npm run build
```

Output is written to `frontend/dist/cloudflare/`. The files to serve are in `frontend/dist/cloudflare/browser/`.

Other scripts, from `frontend/`:

```bash
npm run watch
npm test
npm run lint
npm run format:check
```

`npm run watch` rebuilds the development configuration. It does not serve the app.

The Angular app is standalone and zoneless, styled with Tailwind CSS and a small SCSS layer. `frontend/src/main.ts` bootstraps `App`. Routes, the catalogue client, and the browser wishlist live under `frontend/src/app/`. The browser calls Laravel. Laravel calls TMDB. Notes on the app structure are in [docs/architecture.md](docs/architecture.md) and [docs/development-guidelines.md](docs/development-guidelines.md). Those notes use paths inside the Angular app, so run the npm commands from `frontend/`.

### Frontend environment

| File                                                     | Role                                          |
| -------------------------------------------------------- | --------------------------------------------- |
| `frontend/src/environments/environment.model.ts`         | Shared type for the settings object           |
| `frontend/src/environments/environment.ts`               | Production settings. Used by `npm run build`. |
| `frontend/src/environments/environment.development.ts`   | Development settings. Used by `npm start`.    |

Development uses the relative path `/api`. `npm start` proxies `/api`, `/sanctum`, and `/logout`, plus `POST /login` and `POST /register`, to `https://frame-backend.ddev.site`. `GET /login` and `GET /register` stay in the Angular app. The browser stays on `http://localhost:4200`, so the session cookie is first-party. Production uses `/api` when a reverse proxy on the frontend host forwards the API paths to Laravel and leaves `GET /login` and `GET /register` with the SPA. If Laravel is hosted on another origin, set `apiBaseUrl` in `environment.ts` to that origin before building, for example `https://api.frame.example/api`, and add the frontend origin to `CORS_ALLOWED_ORIGINS`.

Poster and backdrop URLs are still built in the browser from `imageBaseUrl` (`https://image.tmdb.org/t/p`) and the path returned by the API. Image files are not proxied.

`.gitignore` ignores `.env`, `.env.*` except `.env.example`, and `frontend/src/environments/*.local.ts`.

## Backend

Laravel runs in DDEV and proxies TMDB. The read access token and API key live only in `backend/.env`. The token is preferred. The API key is sent only when the token is empty.

DDEV is configured in `backend/.ddev/` as project `frame-backend`, with PHP 8.4, nginx-fpm, and MySQL 8.0. Laravel connects to that database with host `db`, database `db`, username `db`, and password `db`.

From `backend/`:

```bash
cd backend

ddev start
ddev composer install
ddev artisan key:generate
ddev artisan migrate
```

`ddev start` creates the project containers and prints the site URL. On a new checkout, copy the environment file before generating the key:

```bash
cd backend
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`. `.env.example` is tracked. `.env` is ignored and must not be committed. Put the TMDB read access token in `TMDB_ACCESS_TOKEN`. Leave `TMDB_API_KEY` empty unless there is no token. `CORS_ALLOWED_ORIGINS` lists the browser origins allowed to call the API. The example database user and password are DDEV’s defaults.

The application is at `https://frame-backend.ddev.site`. The API is under `https://frame-backend.ddev.site/api`.

### Authentication

FRAME uses Laravel Sanctum cookie authentication for the first-party SPA. The browser does not store the session in `localStorage` or `sessionStorage`.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/sanctum/csrf-cookie` | Issue the CSRF cookie |
| POST | `/register` | Create an account and start a session |
| POST | `/login` | Start a session |
| POST | `/logout` | End the session |
| GET | `/api/user` | Read the signed-in user |

Local DDEV settings in `backend/.env`:

```dotenv
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:4200,127.0.0.1,127.0.0.1:4200
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
```

`SESSION_DOMAIN` stays empty locally because the Angular dev server proxies the API. `SESSION_SECURE_COOKIE` stays false because `http://localhost:4200` is not HTTPS.

For production on a shared parent domain, such as `https://app.frame.example` and `https://api.frame.example`:

```dotenv
SESSION_DOMAIN=.frame.example
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=app.frame.example
CORS_ALLOWED_ORIGINS=https://app.frame.example
```

`SESSION_DOMAIN` must start with a dot so the session cookie is sent to both subdomains. `SANCTUM_STATEFUL_DOMAINS` is the frontend host, without a scheme. Serve the site over HTTPS so the secure cookie is stored.

If the built app keeps `apiBaseUrl` as `/api`, the frontend host must reverse-proxy `/api`, `/sanctum`, and `/logout`, and the `POST` requests for `/login` and `/register`, to Laravel. `GET /login` and `GET /register` must keep serving the Angular app. In that same-origin setup, `SESSION_DOMAIN` can stay empty and `SANCTUM_STATEFUL_DOMAINS` is the frontend host. Use the parent-domain values above when the browser calls the API host directly.

Stop DDEV:

```bash
cd backend
ddev stop
```
