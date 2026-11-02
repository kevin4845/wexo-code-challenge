import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';

const APP_PATHS = ['/api', '/sanctum', '/login', '/register', '/logout'];

/** Plain session token from the API. The cross-origin cookie is not readable here. */
let csrfToken: string | null = null;

export function rememberCsrfToken(token: string | null): void {
  if (token) {
    csrfToken = token;
  }
}

/** Origin of an absolute catalogue URL. Empty when the app uses relative paths. */
export function apiOrigin(): string {
  const base = environment.apiBaseUrl;
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return new URL(base).origin;
  }
  return '';
}

/** Relative path, or the configured API origin when the SPA and API are different hosts. */
export function appUrl(path: string): string {
  const origin = apiOrigin();
  return origin === '' ? path : `${origin}${path}`;
}

function cookieXsrfToken(): string | null {
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

  const changing = request.method !== 'GET' && request.method !== 'HEAD';
  let headers = request.headers;
  if (changing && csrfToken && !headers.has('X-CSRF-TOKEN')) {
    headers = headers.set('X-CSRF-TOKEN', csrfToken);
  } else if (changing && !csrfToken && !headers.has('X-XSRF-TOKEN')) {
    const encrypted = cookieXsrfToken();
    if (encrypted) {
      headers = headers.set('X-XSRF-TOKEN', encrypted);
    }
  }

  return next(request.clone({ headers, withCredentials: true })).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        rememberCsrfToken(event.headers.get('X-CSRF-TOKEN'));
      }
    }),
  );
};
