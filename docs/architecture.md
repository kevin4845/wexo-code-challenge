# Architecture

This application is FRAME, a movie discovery client. Screens, routing and TMDB access are implemented. Film imagery appears only when a TMDB API key is configured.

## Directories

### `src/app/core`

Code used by more than one feature, or by the application shell:

- `services/` holds the TMDB client, the request interceptor and the wishlist.
- `models/` holds domain types shared by more than one feature, such as a movie or a genre. Build-time settings stay in `src/environments/` because they are compile-time configuration, not domain data.
- `guards/` is reserved for functional route guards. None are required yet.

### `src/app/shared`

Presentation that is not tied to one feature: components, pipes, and directives. Shared code must not call TMDB. The movie card is the exception for wishlist state: it reads and toggles `Wishlist` so every poster uses the same control. Feature pages pass the movie in and do not assemble the request.

### `src/app/features`

One directory per product area:

| Directory   | Responsibility                 |
| ----------- | ------------------------------ |
| `home/`     | Entry screen                   |
| `genres/`   | Genre list and genre filtering |
| `movies/`   | Movie list and movie details   |
| `wishlist/` | Movies the user has saved      |
| `search/`   | Results for the header search  |

`core/` and `shared/` are grouped by kind of code because the challenge keeps cross-cutting code separate from features. Inside a feature, keep related files together instead of splitting that feature into its own `components/` and `services/` folders unless the feature grows enough to need it.

## Components and services

`App` (`src/app/app.ts`) is the root component. Its template is the skip link, header, router outlet and footer. It does not load data.

Feature components own the screen for their route. They read state and call services. They do not assemble HTTP requests.

Services own work that is not presentation:

- `Tmdb` talks to TMDB.
- `Wishlist`, in `core/services/`, owns the saved-movie collection so the header, cards and pages share one store.

Use Angular’s `@Service()` decorator for services. It is the CLI default and provides the class for injection. Inject dependencies with `inject()`.

## Routing

`provideRouter(routes)` is registered in `src/app/app.config.ts`, with component input binding and scroll restoration. Feature routes are lazy-loaded with `loadComponent`:

| Path               | Feature             |
| ------------------ | ------------------- |
| `/`                | `features/home`     |
| `/genres`          | `features/genres`   |
| `/genres/:genreId` | `features/genres`   |
| `/movies/:id`      | `features/movies`   |
| `/wishlist`        | `features/wishlist` |
| `/search`          | `features/search`   |

Use functional guards from `core/guards/` only when a route must allow or block navigation. Do not add a guard preemptively.

## API communication

`provideHttpClient(withInterceptors([tmdbAuthInterceptor]))` is registered in `src/app/app.config.ts`. In Angular 22 this uses the Fetch backend. TMDB calls go through `Tmdb` in `core/services/`, which reads `environment.tmdb`.

Cross-cutting HTTP behavior, such as sending the credential, belongs in a functional interceptor passed to `provideHttpClient(withInterceptors([...]))`. Individual features should not attach the credential themselves.

`src/main.ts` selects production behavior from `environment.production`. `npm start` and `npm run watch` replace `environment.ts` with `environment.development.ts`. `npm run build` uses `environment.ts`.

## Wishlist state

`Wishlist` keeps the saved films in a signal and writes them to `localStorage` under `frame.wishlist`. Components read `items`, `count` and `isSaved` in the template.

Do not add a global store. Signals are enough for this one collection.

## Decisions

- Standalone components only. The app does not use NgModules.
- Zoneless change detection. `zone.js` is not a dependency. Update state through signals, template events, or `HttpClient` so the view refreshes.
- OnPush is the compiler default when a component omits `changeDetection`. Leave that default in place.
- No server-side rendering. The challenge is a client application, and SSR would add a server build without a current need.
- No UI library and no Tailwind configuration in this setup.
- SCSS for component styles and `src/styles.scss` for global styles.
- Strict TypeScript (`strict`) and strict Angular templates (`strictTemplates`), plus the extra checks generated for a strict Angular application: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictInjectionParameters`, and `strictInputAccessModifiers`.

The decision record for this setup is [decisions/0001-angular-application-setup.md](decisions/0001-angular-application-setup.md).
