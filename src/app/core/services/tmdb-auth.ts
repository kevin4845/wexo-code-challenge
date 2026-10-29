import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

/** Thrown when the build has no TMDB base URL or API key, before any request is sent. */
export class TmdbConfigError extends Error {
  constructor() {
    super('TMDB is not configured.');
    this.name = 'TmdbConfigError';
  }
}

export const tmdbConfigMessage =
  'Add a TMDB API key in a gitignored local environment file to load films.';

/**
 * Copy safe to show in the interface.
 * HttpClient error text can include the request URL, and that URL carries the API key.
 */
export function catalogueErrorCopy(error: unknown): string {
  if (error instanceof TmdbConfigError) {
    return tmdbConfigMessage;
  }
  if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
    return 'TMDB refused the request. Check that the local API key is valid.';
  }
  return 'The catalogue could not be loaded. Check the connection and try again.';
}

/**
 * Attaches the TMDB key only to requests for the configured API host.
 * The key is never written to logs or component state.
 */
export const tmdbAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const { apiBaseUrl, apiKey } = environment.tmdb;
  if (!apiKey || !apiBaseUrl || !request.url.startsWith(apiBaseUrl)) {
    return next(request);
  }

  return next(request.clone({ setParams: { api_key: apiKey } }));
};
