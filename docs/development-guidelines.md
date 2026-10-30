# Development guidelines

Follow these conventions for this repository. The [Angular style guide](https://angular.dev/style-guide) is the baseline. Where this document names a project-specific choice, follow that choice.

## Naming

- Use lowercase, hyphenated file names. The file name matches the class: `home.ts` exports `Home`, `movie-catalog.ts` exports `MovieCatalog`.
- Do not add `.component`, `.service`, `.pipe`, or `.directive` suffixes to file names. The Angular 22 CLI in this workspace generates that form by default (`ng generate component features/home` creates `home.ts`).
- Place a unit test beside the file it covers and name it `*.spec.ts`.
- Component selectors use the `app` prefix and kebab-case: `app-home`.
- Directive selectors use the `app` prefix and camelCase: `appPoster`.
- Route paths are lowercase. Use a parameter segment for an id, as in `movies/:id`.
- Name an event handler for the action it performs, such as `saveMovie()`, not for the DOM event.

## TypeScript and Angular

- Keep `strict` and `strictTemplates` enabled.
- Prefer standalone components. Do not introduce NgModules.
- Leave change detection at the default OnPush. Set `Eager` only when OnPush cannot express the update.
- Use `input()`, `output()`, `model()`, and queries as `readonly`. Use `protected` for members that exist for the template and are not part of the class’s public API.
- Group injected dependencies, inputs, outputs, and queries above methods.
- Prefer `inject()` over constructor parameters.
- Prefer signals for component and feature state. Use `computed()` for a value derived from other signals.
- Implement the matching lifecycle interface, such as `OnInit`, when a component uses a lifecycle hook. Keep the hook itself short and call a named method.
- One main concept per file. Colocate a component’s `.ts`, `.html`, and `.scss` files.
- Components and directives stay focused on presentation. HTTP, TMDB mapping, and wishlist updates belong in services.
- Use `@Service()` for injectable services. That is what `ng generate service` emits in this workspace.
- Generate route guards as functions. Put a guard in `core/guards/` only when a route needs it.
- Do not add barrel `index.ts` files unless a folder has several public exports and the barrel removes repeated import paths.

## Component and service responsibilities

- `App` hosts the router outlet. Feature screens are routed components, not content added to `App`.
- A feature component may depend on services in its own feature and on `core` services. It should not reach into another feature’s files for data access. Share that behavior through `core` or through inputs.
- Shared components receive data through inputs and report actions through outputs. They do not inject the TMDB service or the wishlist service.
- The future TMDB service is the only code that knows TMDB URLs and request shapes.
- The future wishlist service is the only code that changes the saved-movie collection.

## Future API error handling

- Check `environment.tmdb` before sending a request. If `apiKey` or `apiBaseUrl` is empty, fail with an error that says the TMDB configuration is missing. Do not send the request.
- Let the core service perform the HTTP call. The feature that started the action is responsible for a loading state and an error state the user can see.
- Do not catch an error and ignore it. Add context when rethrowing, without including the API key, the authorization header, or the raw credential.
- Map transport failures and non-success HTTP statuses into a result the feature can render. A failed genre request must not be presented as an empty genre list.
- Put cross-cutting HTTP behavior in one functional interceptor registered with `provideHttpClient()`. Do not copy credential or logging logic into each call.
- Log failures with `console.error` or a later logger only when the message is safe to store. Do not log request headers that contain the API key.

## Formatting and linting

- Prettier is the formatter. The settings are in `.prettierrc`: print width 100, single quotes, and the Angular parser for HTML. Markdown prose is left unwrapped.
- ESLint is for correctness and Angular rules. `eslint-config-prettier` turns off ESLint rules that conflict with Prettier. Do not re-enable those rules to enforce style.
- Before handing work on, run:

```bash
npm run format:check
npm run lint
npm test
```

- `npm run format` rewrites files. `npm run format:check` does not.
- Do not disable a lint rule for a file to get past a real problem. A single-line disable is acceptable only with a short note that explains why the rule cannot apply.

## Keeping the implementation small

- Add a file when it has a behavior or a type the application uses. Do not add empty services, mock catalogs, or placeholder screens.
- Prefer a function or a service method over a new class hierarchy.
- Do not add NgRx or a UI component library. Style new interface with Tailwind utilities. Add component CSS only for motion or layered layout that utilities cannot express cleanly.
- Keep TMDB types close to the service that returns them until another feature needs the same type. Move a type to `core/models/` when a second feature imports it.
- Comments should record a constraint that the code cannot show on its own, such as why a credential must stay empty. Do not comment obvious assignments.
