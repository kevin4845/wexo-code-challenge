import type { AppEnvironment } from './environment.model';

/**
 * Production settings, used by `npm run build`.
 * `/api` is same-origin. When Laravel is on a sibling subdomain, set this
 * to that origin before building, for example `https://api.frame.example/api`.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://wexoapi.kevinmm.dk/api',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
};
