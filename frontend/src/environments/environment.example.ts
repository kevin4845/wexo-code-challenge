import type { AppEnvironment } from './environment.model';

/**
 * Local development uses `/api`. `npm start` proxies that path, plus
 * `/sanctum`, `/login`, `/register`, and `/logout`, to the DDEV app.
 * A sibling production API uses an absolute origin, for example
 * `https://api.frame.example/api`.
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: '/api',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
};
