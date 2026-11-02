import type { AppEnvironment } from './environment.model';

/**
 * Production settings, used by `npm run build`.
 * `/api` is same-origin. Set this to the deployed Laravel origin before
 * building when the API is hosted separately.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: '/api',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
};
