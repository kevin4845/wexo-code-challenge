import type { AppEnvironment } from './environment.model';

/**
 * Local development talks to the DDEV Laravel app.
 * Production builds use `/api` unless the API is hosted on another origin.
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'https://frame-backend.ddev.site/api',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
};
