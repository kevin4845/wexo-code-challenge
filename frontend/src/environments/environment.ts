import type { AppEnvironment } from './environment.model';

/**
 * Production settings, used by `npm run build`.
 * The API is the sibling host. Session cookies stay on that host.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://wexoapi.kevinmm.dk/api',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
};
