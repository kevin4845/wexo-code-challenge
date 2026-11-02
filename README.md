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

The Angular app is standalone and zoneless, styled with Tailwind CSS and a small SCSS layer. `frontend/src/main.ts` bootstraps `App`. Routes, the TMDB client, and the browser wishlist live under `frontend/src/app/`. Notes on those choices are in [docs/architecture.md](docs/architecture.md) and [docs/development-guidelines.md](docs/development-guidelines.md). Those notes use paths inside the Angular app, so run the npm commands from `frontend/`.

### Frontend environment

| File                                                     | Role                                          |
| -------------------------------------------------------- | --------------------------------------------- |
| `frontend/src/environments/environment.model.ts`         | Shared type for the settings object           |
| `frontend/src/environments/environment.ts`               | Production settings. Used by `npm run build`. |
| `frontend/src/environments/environment.development.ts`   | Development settings. Used by `npm start`.    |

Both setting files use TMDB’s public hosts. Put a read access token in `environment.development.ts` for local work. Do not commit that token.

A credential in this frontend is readable in the compiled JavaScript bundle. That is acceptable for this test project only. A production app should keep the token in backend environment variables or Cloudflare secrets and proxy TMDB through that backend.

The read access token is sent as a Bearer token. The API key is sent only when the token is empty. `.gitignore` ignores `.env`, `.env.*` except `.env.example`, and `frontend/src/environments/*.local.ts`.

## Backend

The backend is a fresh Laravel application running in DDEV. It has the standard routes, configuration, and tests. It does not call TMDB and it does not add application endpoints.

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

On macOS or Linux, use `cp .env.example .env` instead of `copy`. `.env.example` is tracked. `.env` is ignored and must not be committed. The example contains only DDEV’s default database credentials.

The application is at `https://frame-backend.ddev.site`.

Stop DDEV:

```bash
cd backend
ddev stop
```
