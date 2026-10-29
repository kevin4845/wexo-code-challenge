# WEXO Code Challenge

Foundation for a movie discovery application. The finished product will let someone browse movies, filter them by genre, open a movie, and keep a wishlist. This repository is the initial Angular setup: tooling, application structure, and documentation. Those features are not implemented yet.

## Technologies and architecture

| Area             | Choice                                            |
| ---------------- | ------------------------------------------------- |
| Framework        | Angular 22.2.3, standalone components             |
| Language         | TypeScript 6.0.3, strict mode                     |
| Routing          | Angular Router                                    |
| HTTP             | `HttpClient` through `provideHttpClient()`        |
| Change detection | Zoneless, with OnPush as the default strategy     |
| State            | Angular signals, when a feature needs local state |
| Styles           | SCSS                                              |
| Package manager  | npm 11                                            |
| Lint             | ESLint 10 and angular-eslint 22                   |
| Format           | Prettier 3                                        |
| Unit tests       | Vitest 5, run by the Angular CLI                  |

`package-lock.json` pins these versions. `@angular/forms` is not installed; add it when a feature needs forms.

The application is a single standalone app. `src/main.ts` bootstraps `App`, which renders a router outlet and nothing else. Route tables, API access, and feature state will be added with the features that need them. The reasons for these choices are in [docs/architecture.md](docs/architecture.md) and [docs/decisions/0001-angular-application-setup.md](docs/decisions/0001-angular-application-setup.md).

## Prerequisites

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` (the range required by Angular 22.2)
- npm 11. The repository `packageManager` field is `npm@11.19.1`.

This setup was created with Node.js 24.22.1 and npm 11.19.1.

## Installation

From the repository root:

```bash
npm install
```

## Development server

```bash
npm start
```

This runs `ng serve` with the development configuration. The server prints a local URL, which is `http://localhost:4200/` unless that port is already in use. The development build replaces `src/environments/environment.ts` with `src/environments/environment.development.ts`.

Stop the server with `Ctrl+C`.

## Build

```bash
npm run build
```

This runs `ng build` with the production configuration. Output is written to `dist/wexo-code-challenge/`. The files to serve are in `dist/wexo-code-challenge/browser/`.

To rebuild the development configuration whenever a file changes:

```bash
npm run watch
```

`npm run watch` is a build watcher. It does not serve the application. Use `npm start` for the dev server.

## Linting and formatting

```bash
npm run lint
npm run format:check
```

`npm run lint` runs ESLint on `src/**/*.ts` and `src/**/*.html`. `npm run format:check` checks formatting with Prettier and does not write files.

To format the project:

```bash
npm run format
```

ESLint uses `eslint-config-prettier` so formatting rules are left to Prettier. Editor settings in `.vscode/settings.json` format on save with Prettier and apply ESLint fixes on save when those extensions are installed.

## Project structure

```text
src/
├─ main.ts                          Application bootstrap
├─ index.html
├─ styles.scss                      Global styles
├─ environments/                    Build-time configuration
└─ app/
   ├─ app.ts                        Root component
   ├─ app.config.ts                 Router, HttpClient, zoneless change detection
   ├─ app.routes.ts                 Root route table
   ├─ core/
   │  ├─ services/                  Cross-feature services, including future TMDB access
   │  ├─ models/                    Domain types shared by more than one feature
   │  └─ guards/                    Route guards, when a route needs one
   ├─ shared/
   │  ├─ components/                Reusable presentation
   │  ├─ pipes/
   │  └─ directives/
   └─ features/
      ├─ home/
      ├─ genres/
      ├─ movies/
      └─ wishlist/
```

`core/`, `shared/`, and `features/` currently contain `.gitkeep` files so Git retains the directories. They are not application code. Conventions for what belongs in each directory are in [docs/architecture.md](docs/architecture.md) and [docs/development-guidelines.md](docs/development-guidelines.md).

## Environment configuration

| File                                          | Role                                                           |
| --------------------------------------------- | -------------------------------------------------------------- |
| `src/environments/environment.model.ts`       | Shared type for the settings object                            |
| `src/environments/environment.ts`             | Production settings. Used by `npm run build`.                  |
| `src/environments/environment.development.ts` | Development settings. Used by `npm start` and `npm run watch`. |

Both setting files leave TMDB values empty:

```ts
tmdb: {
  apiKey: '',
  apiBaseUrl: '',
  imageBaseUrl: '',
}
```

Empty strings mean the values are not configured. Do not invent values in the tracked files, and do not commit a real API key.

`.gitignore` ignores `.env`, `.env.*` except `.env.example`, and `src/environments/*.local.ts`. When API work starts, put credentials in a gitignored `src/environments/*.local.ts` file. `environment.development.ts` must not import `environment.ts`: the development build replaces that file, so an import would point at itself.

`src/main.ts` calls `enableProdMode()` only when `environment.production` is true.

## Planned TMDB API integration

No TMDB requests are implemented. Integration should follow this shape:

- Add a service under `src/app/core/services/` that is the only place that calls TMDB.
- Read `apiKey`, `apiBaseUrl`, and `imageBaseUrl` from `environment`. Copy the URL values from the current TMDB API documentation, and copy the key from the developer’s own TMDB account.
- Register cross-cutting HTTP behavior, such as attaching the credential, with `provideHttpClient(withInterceptors([...]))` in `src/app/app.config.ts`.
- Refuse to send a request when `apiKey` or `apiBaseUrl` is empty.
- Keep the key out of Git, logs, and error messages.

Angular 22’s `HttpClient` uses the Fetch backend by default. `withFetch()` is deprecated and is not used.

## Testing

```bash
npm test
```

This runs `ng test --watch=false`. The Angular CLI runs Vitest in Node.js with jsdom. Tests live next to the code they cover, named `*.spec.ts`.

To re-run tests when files change:

```bash
npm run test:watch
```

This runs `ng test --watch=true`. Without `--watch`, the CLI watches only when it is attached to a terminal.

## Current implementation status

Configured and present:

- Standalone Angular application with a root router outlet
- Router, zoneless change detection, and `HttpClient`
- Strict TypeScript and strict Angular templates
- Development and production environment files, with TMDB fields empty
- ESLint, Prettier, and the npm scripts above
- Unit tests for the root component

Not implemented:

- Visual design and page layouts
- TMDB requests
- Movie browsing, genre filtering, movie details, and the wishlist
- UI component libraries and Tailwind CSS
