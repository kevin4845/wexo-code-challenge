import type { AppEnvironment } from './environment.model';

/**
 * Copy these placeholders into environment.development.ts for local development
 * and into environment.ts only for a production build you do not commit.
 * Replace both placeholder strings before running the app.
 */
export const environment: AppEnvironment = {
  production: false,
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    accessToken: 'YOUR_TMDB_READ_ACCESS_TOKEN',
    apiKey: 'YOUR_TMDB_API_KEY',
  },
};
