# 1. Angular application setup

## Status

Accepted

## Context

The WEXO challenge needs a movie discovery application that another developer can run and extend. The first step is the project foundation. The assessment values clarity and maintainability, and it excludes page layout, TMDB calls, and wishlist behavior for now.

The application will need routing, HTTP, typed configuration for a future API key, and a place for feature state. It does not need server rendering, a component library, or a global state library at this size.

## Decision

Create one Angular 22 application with the Angular CLI and npm.

- Use standalone components, the 2025 file names (`home.ts`, class `Home`), and SCSS.
- Enable strict TypeScript and strict Angular templates, and keep the strict bundle budgets from the CLI.
- Bootstrap with `provideRouter`, `provideHttpClient()`, and `provideZonelessChangeDetection()`. Do not depend on `zone.js`. `HttpClient` uses the Fetch backend, which is the Angular 22 default, so `withFetch()` is not added.
- Leave the route table empty. Add lazy-loaded feature routes when home, genres, movies, and wishlist are implemented.
- Organize code as `core/`, `shared/`, and `features/` (`home`, `genres`, `movies`, `wishlist`). Leave those directories empty of application code until there is behavior to put there.
- Store build-time settings in `src/environments/`. Commit empty TMDB fields. Ignore `.env` files and `src/environments/*.local.ts` so a real API key is not part of the repository.
- Use ESLint with angular-eslint, Prettier, and `eslint-config-prettier`.
- Run unit tests with Vitest through `ng test`.
- Use signals for future feature state, including the wishlist. Do not add NgRx in this setup.
- Do not enable server-side rendering.

`@angular/forms` is omitted until a screen needs it.

## Consequences

- The repository builds and serves a blank routed shell. There is no movie UI and no network access to TMDB.
- Zoneless change detection will not refresh a view because a timer, promise, or third-party callback ran. Updates need a signal, a template event, or an Angular HTTP API.
- New components are OnPush unless `changeDetection` is set otherwise. That matches zoneless change detection.
- A developer must supply TMDB URLs and a key locally before API calls can succeed. The tracked environment files stay empty. Git ignores the intended local override files, but it will still commit a key if someone writes that key into `environment.ts` or `environment.development.ts`.
- `environment.development.ts` cannot import `environment.ts`, because the development build replaces `environment.ts` with the development file.
- Feature work has an obvious home, and the root component does not need to change to add a screen.
- Adding forms, a UI library, Tailwind, SSR, or a state library is a separate decision when a feature needs it.
