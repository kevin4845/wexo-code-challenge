# Architecture

This application is FRAME, a movie discovery client. Screens and routing are implemented. The browser calls the Laravel API. Film imagery appears only when that API is configured with TMDB credentials.

## Directories

### `src/app/core`

Code used by more than one feature, or by the application shell:

- `services/` holds authentication, the catalogue client, the request interceptor, and the wishlist.
- `models/` holds domain types shared by more than one feature, such as a movie or a genre. Build-time settings stay in `src/environments/` because they are compile-time configuration, not domain data.
- `guards/` holds `authGuard` and `guestGuard`.

### `src/app/shared`

Presentation that is not tied to one feature: components, pipes, and directives. Shared code must not call TMDB. The movie card is the exception for wishlist state: it reads and toggles `Wishlist` so every poster uses the same control. Feature pages pass the movie in and do not assemble the request.

### `src/app/features`

One directory per product area:

| Directory   | Responsibility                 |
| ----------- | ------------------------------ |
| `home/`     | Entry screen                   |
| `genres/`   | Genre list and genre filtering |
| `movies/`   | Movie details                  |
| `wishlist/` | Movies the user has saved      |
| `search/`   | Results for the header search  |

`core/` and `shared/` are grouped by kind of code because the challenge keeps cross-cutting code separate from features. Inside a feature, keep related files together instead of splitting that feature into its own `components/` and `services/` folders unless the feature grows enough to need it.

## Components and services

`App` (`src/app/app.ts`) is the root component. Its template is the skip link, header, router outlet and footer. It does not load data.

Feature components own the screen for their route. They read state and call services. They do not assemble HTTP requests.

Services own work that is not presentation:

- `Tmdb` talks to the Laravel catalogue. It does not call TMDB.
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

`authGuard` wraps the catalogue routes. `guestGuard` keeps a signed-in user off the login and register screens. Add another guard only when a route must allow or block navigation.

## API communication

`provideHttpClient` is registered in `src/app/app.config.ts`, with the Sanctum interceptor. In Angular 22 this uses the Fetch backend. `Tmdb` calls the Laravel API. It does not call TMDB and it does not hold a TMDB credential.

Cross-cutting HTTP behavior, such as sending the credential, belongs in a functional interceptor passed to `provideHttpClient(withInterceptors([...]))`. Individual features should not attach the credential themselves.

`src/main.ts` selects production behavior from `environment.production`. `npm start` and `npm run watch` replace `environment.ts` with `environment.development.ts`. `npm run build` uses `environment.ts`.

## Wishlist state

`Wishlist` keeps the saved films in a signal. The database, through the Laravel API, is the source of truth. A leftover browser list is copied into the account once and then removed. Components read `items`, `count` and `isSaved` in the template.

Do not add a global store. Signals are enough for this one collection.

## Decisions

- Standalone components only. The app does not use NgModules.
- Zoneless change detection. `zone.js` is not a dependency. Update state through signals, template events, or `HttpClient` so the view refreshes.
- OnPush is the compiler default when a component omits `changeDetection`. Leave that default in place.
- No server-side rendering. The challenge is a client application, and SSR would add a server build without a current need.
- No UI component library. Tailwind CSS supplies layout, type, and color. `src/styles.scss` keeps the theme and the rules utilities express poorly: layered photographs, scrollers, and motion.
- Component SCSS is for layout utilities cannot express, such as the sticky header and the phone movie page. The trailer overlay uses Tailwind.
- Strict TypeScript (`strict`) and strict Angular templates (`strictTemplates`), plus the extra checks generated for a strict Angular application: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictInjectionParameters`, and `strictInputAccessModifiers`.

The decision record for this setup is [decisions/0001-angular-application-setup.md](decisions/0001-angular-application-setup.md).
