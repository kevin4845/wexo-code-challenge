import { HttpErrorResponse } from '@angular/common/http';

/** Thrown when the build has no catalogue API address, before any request is sent. */
export class TmdbConfigError extends Error {
  constructor() {
    super('The catalogue API is not configured.');
    this.name = 'TmdbConfigError';
  }
}

export const tmdbConfigMessage = 'The catalogue API address is not set.';

/**
 * Copy safe to show in the interface.
 * HttpClient error text can include the request URL.
 */
export function catalogueErrorCopy(error: unknown): string {
  if (error instanceof TmdbConfigError) {
    return tmdbConfigMessage;
  }
  if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
    return 'The catalogue refused the request.';
  }
  return 'The catalogue could not be loaded. Check the connection and try again.';
}
