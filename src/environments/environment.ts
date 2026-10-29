import type { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  tmdb: {
    apiKey: '',
    apiBaseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
};
