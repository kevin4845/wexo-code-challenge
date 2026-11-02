import type { AppEnvironment } from './environment.model';

/**
 * Production settings, used by `npm run build`.
 * Leave the credentials empty here. A real token belongs only in a local,
 * uncommitted environment file. See environment.example.ts.
 */
export const environment: AppEnvironment = {
  production: true,
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    accessToken: '',
    apiKey: '',
  },
};
