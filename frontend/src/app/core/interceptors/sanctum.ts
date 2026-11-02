import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

const APP_PATHS = ['/api', '/sanctum', '/login', '/register', '/logout'];

/** Origin of an absolute catalogue URL. Empty when the app uses relative paths. */
export function apiOrigin(): string {
  const base = environment.apiBaseUrl;
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return new URL(base).origin;
  }
  return '';
}

/** Same-origin path in development, or the configured API origin in production. */
export function appUrl(path: string): string {
  const origin = apiOrigin();
  return origin === '' ? path : `${origin}${path}`;
}

function readXsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

function isAppRequest(url: string): boolean {
  if (
    APP_PATHS.some(
      (path) => url === path || url.startsWith(`${path}/`) || url.startsWith(`${path}?`),
    )
  ) {
    return true;
  }
  const origin = apiOrigin();
  return origin !== '' && url.startsWith(origin);
}

/** Sends the session cookie and the Sanctum CSRF header with application requests. */
export const sanctumInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isAppRequest(request.url)) {
    return next(request);
  }

  const token = readXsrfToken();
  const changing = request.method !== 'GET' && request.method !== 'HEAD';
  const headers =
    token && changing && !request.headers.has('X-XSRF-TOKEN')
      ? request.headers.set('X-XSRF-TOKEN', token)
      : request.headers;

  return next(request.clone({ headers, withCredentials: true }));
};
