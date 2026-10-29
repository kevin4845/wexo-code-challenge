# Architecture

This application is a movie discovery client. The setup keeps routing, HTTP, and feature boundaries ready without implementing screens or the TMDB API.

## Directories

### `src/app/core`

Code used by more than one feature, or by the application shell:

- `services/` will hold the TMDB client and other cross-feature I/O.
- `models/` will hold domain types shared by more than one feature, such as a movie or a genre. Build-time settings stay in `src/environments/` because they are compile-time configuration, not domain data.
- `guards/` will hold functional route guards when a route needs one. None are required yet.

### `src/app/shared`

Presentation that is not tied to one feature: components, pipes, and directives. Shared code must not call TMDB or read wishlist state. If a widget needs feature data, it belongs in that feature and receives the data as inputs.

### `src/app/features`

One directory per product area:

| Directory   | Responsibility                 |
| ----------- | ------------------------------ |
| `home/`     | Entry screen                   |
| `genres/`   | Genre list and genre filtering |
| `movies/`   | Movie list and movie details   |
| `wishlist/` | Movies the user has saved      |

These directories contain only `.gitkeep` today, so Git keeps the folders. Feature code is added when that feature is built. Do not add a service, component, or route whose only purpose is to occupy the folder.

`core/` and `shared/` are grouped by kind of code because the challenge keeps cross-cutting code separate from features. Inside a feature, keep related files together instead of splitting that feature into its own `components/` and `services/` folders unless the feature grows enough to need it.

## Components and services

`App` (`src/app/app.ts`) is the root component. Its template is a single `<router-outlet />`. It does not load data.

Future feature components own the screen for their route. They read state and call services. They do not assemble HTTP requests.

Future services own work that is not presentation:

- A core service talks to TMDB.
- A wishlist service, living under `features/wishlist/`, owns the saved-movie collection.

Use Angular’s `@Service()` decorator for services. It is the CLI default and provides the class for injection. Inject dependencies with `inject()`.

## Routing

`provideRouter(routes)` is registered in `src/app/app.config.ts`. The route table in `src/app/app.routes.ts` is empty until the features exist.

When a feature is added, lazy-load it from `app.routes.ts` with `loadChildren` or `loadComponent`, and keep that feature’s route definitions next to the feature. Planned paths:

| Path          | Feature             |
| ------------- | ------------------- |
| `/`           | `features/home`     |
| `/genres`     | `features/genres`   |
| `/movies`     | `features/movies`   |
| `/movies/:id` | `features/movies`   |
| `/wishlist`   | `features/wishlist` |

Use functional guards from `core/guards/` only when a route must allow or block navigation. Do not add a guard preemptively.

## API communication

`provideHttpClient()` is registered in `src/app/app.config.ts`. In Angular 22 this uses the Fetch backend. Future TMDB calls go through one service in `core/services/`, which reads `environment.tmdb`.

Cross-cutting HTTP behavior, such as sending the credential, belongs in a functional interceptor passed to `provideHttpClient(withInterceptors([...]))`. Individual features should not attach the credential themselves.

`src/main.ts` selects production behavior from `environment.production`. `npm start` and `npm run watch` replace `environment.ts` with `environment.development.ts`. `npm run build` uses `environment.ts`.

## Wishlist state

Keep wishlist state in a service inside `features/wishlist/`, using a signal for the saved movies. Other features that need to add or remove a movie depend on that service. Components read the signal in the template.

Do not add a global store. Signals are enough for one collection owned by one feature. Persistence, if it is required later, can be added inside that same service.

## Decisions

- Standalone components only. The app does not use NgModules.
- Zoneless change detection. `zone.js` is not a dependency. Update state through signals, template events, or `HttpClient` so the view refreshes.
- OnPush is the compiler default when a component omits `changeDetection`. Leave that default in place.
- No server-side rendering. The challenge is a client application, and SSR would add a server build without a current need.
- No UI library and no Tailwind configuration in this setup.
- SCSS for component styles and `src/styles.scss` for global styles.
- Strict TypeScript (`strict`) and strict Angular templates (`strictTemplates`), plus the extra checks generated for a strict Angular application: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictInjectionParameters`, and `strictInputAccessModifiers`.

The decision record for this setup is [decisions/0001-angular-application-setup.md](decisions/0001-angular-application-setup.md).
