# FRAME

FRAME is a movie discovery application. The Angular frontend talks to a Laravel API. Movie data and images come from [The Movie Database (TMDB)](https://www.themoviedb.org/).

Signed-in users can:

- Browse movies and genres
- Search for movies
- Open a film for details, credits, and related titles
- Save and remove films on a personal wishlist
- Register and sign in

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | Angular 22, TypeScript, Tailwind CSS, Angular Signals |
| Backend | Laravel 13, PHP 8.4 locally (PHP 8.5 in production), Laravel Sanctum, MySQL 8.0, Laravel database cache |
| External | TMDB API |
| Infrastructure | Cloudflare Pages, Cloudflare DNS, Ploi.io, Hetzner, DDEV |

Authentication uses Sanctum session cookies. The API does not use personal access tokens.

## Architecture

The browser loads the Angular app and calls the Laravel REST API. Laravel authenticates users, stores users and wishlists in MySQL, and requests movie data from TMDB. Successful TMDB responses are cached. Poster and backdrop files are loaded in the browser from TMDB's image host.

| Environment | Frontend | API |
| --- | --- | --- |
| Production | https://wexo.kevinmm.dk | https://wexoapi.kevinmm.dk |
| Local | http://localhost:4200 | https://frame-backend.ddev.site |

```mermaid
flowchart LR
  browser[Browser]

  subgraph cloudflare[Cloudflare]
    direction TB
    dns[Cloudflare DNS]
    pages[Cloudflare Pages<br/>Angular frontend]
  end

  subgraph hetzner[Hetzner server]
    direction TB
    laravel[Laravel · PHP 8.5<br/>auth, wishlists, TMDB, cache]
    mysql[(MySQL)]
  end

  ploi[Ploi.io<br/>management and deployments]
  tmdb[TMDB API]

  dns -.->|wexo.kevinmm.dk| pages
  dns -.->|wexoapi.kevinmm.dk| laravel
  browser -->|loads the frontend over HTTPS| pages
  browser -->|HTTPS REST API| laravel
  laravel -->|database connection| mysql
  laravel -->|movie data over HTTPS| tmdb
  ploi -.->|manages and deploys| hetzner
```

## Hosting

**Frontend.** The Angular app is hosted on Cloudflare Pages. Cloudflare DNS serves the domain. The site is https://wexo.kevinmm.dk.

**Backend.** Laravel runs on a Hetzner server managed with Ploi.io, including the site configuration and deployments. The server runs a web server with PHP 8.5. MySQL is on the same server. The API is https://wexoapi.kevinmm.dk.

## Project structure

```text
/
├── frontend/          Angular application
├── backend/           Laravel application
│   └── .ddev/         DDEV configuration
├── docs/              Architecture notes and development guidelines
└── README.md
```

## Local development

DDEV runs only the Laravel app. From `backend/`, the project name is `frame-backend`, with PHP 8.4, nginx-fpm, and MySQL 8.0. Inside DDEV, MySQL is reached at host `db`. The credentials are the DDEV defaults in `backend/.env.example`.

### Backend

```bash
cd backend
copy .env.example .env
ddev start
ddev composer install
ddev artisan key:generate
ddev artisan migrate
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`. Put a TMDB read access token in `TMDB_ACCESS_TOKEN`. Leave `TMDB_API_KEY` empty unless there is no token.

The API is at https://frame-backend.ddev.site. Stop it with:

```bash
cd backend
ddev stop
```

### Frontend

```bash
cd frontend
npm install
copy src\environments\environment.example.ts src\environments\environment.development.ts
npm start
```

On macOS or Linux, use `cp src/environments/environment.example.ts src/environments/environment.development.ts`.

`npm start` runs `ng serve` at http://localhost:4200. The development server proxies `/api`, `/sanctum`, and `/logout`, plus `POST /login` and `POST /register`, to https://frame-backend.ddev.site. `GET /login` and `GET /register` stay in the Angular app. Keep `apiBaseUrl` as `/api` so those requests remain on localhost and the session cookie is first-party.

Start DDEV before `npm start`.

## Environment configuration

Secrets are not committed. `backend/.env` and `frontend/src/environments/environment.development.ts` are ignored. Copy the example files above and fill in local values only.

`backend/.env.example` lists the database, session, Sanctum, CORS, and TMDB settings. Do not commit API tokens, the application key, or database passwords. The production frontend origin must be included in `CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS` on the server. The production build reads `apiBaseUrl` from `frontend/src/environments/environment.ts`.
