import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

/** Thrown when the build has no TMDB base URL or credential, before any request is sent. */
export class TmdbConfigError extends Error {
  constructor() {
    super('TMDB is not configured.');
    this.name = 'TmdbConfigError';
  }
}

export const tmdbConfigMessage =
  'Add a TMDB read access token in the local environment file to load films.';

/**
 * Copy safe to show in the interface.
 * HttpClient error text can include the request URL. Credentials stay out of that copy.
 */
export function catalogueErrorCopy(error: unknown): string {
  if (error instanceof TmdbConfigError) {
    return tmdbConfigMessage;
  }
  if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
    return 'TMDB refused the request. Check that the local read access token is valid.';
  }
  return 'The catalogue could not be loaded. Check the connection and try again.';
}

/**
 * Sends the read access token as a Bearer credential, and only to the configured API host.
 * The API key is attached only when no token is set. The two are never sent together.
 */
export const tmdbAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const { baseUrl, accessToken, apiKey } = environment.tmdb;
  if (!baseUrl || !request.url.startsWith(baseUrl)) {
    return next(request);
  }

  const token = accessToken.trim();
  if (token) {
    return next(
      request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  const key = apiKey.trim();
  if (key) {
    return next(request.clone({ setParams: { api_key: key } }));
  }

  return next(request);
};
