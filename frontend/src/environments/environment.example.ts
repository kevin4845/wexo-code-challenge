import type { AppEnvironment } from './environment.model';

/**
 * Copy to `environment.development.ts` for local DDEV.
 * The browser calls that API directly from http://localhost:4200.
 * Production uses `environment.ts` (`https://wexoapi.kevinmm.dk/api`).
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'https://frame-backend.ddev.site/api',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
};
