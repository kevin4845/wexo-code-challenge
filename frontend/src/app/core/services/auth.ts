import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { appUrl, rememberCsrfToken } from '../interceptors/sanctum';

export interface AuthUser {
  readonly id: number;
  readonly name: string;
  readonly email: string;
}

export interface AuthFailure {
  readonly message: string | null;
  readonly fields: Readonly<Record<string, string>>;
}

@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly user = signal<AuthUser | null>(null);
  private readonly ready = signal(false);
  private pending: Observable<boolean> | null = null;

  readonly currentUser = this.user.asReadonly();
  readonly initialized = this.ready.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  getCurrentUser(): AuthUser | null {
    return this.user();
  }

  checkAuthentication(): Observable<boolean> {
    if (this.ready()) {
      return of(this.isAuthenticated());
    }

    this.pending ??= this.http.get<AuthUser>(appUrl('/api/user'), { withCredentials: true }).pipe(
      tap((user) => this.user.set(user)),
      map(() => true),
      catchError(() => {
        this.user.set(null);
        return of(false);
      }),
      tap(() => this.ready.set(true)),
      shareReplay(1),
    );

    return this.pending;
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.ensureCsrf().pipe(
      switchMap(() =>
        this.http.post<AuthUser>(appUrl('/login'), { email, password }, { withCredentials: true }),
      ),
      tap((user) => this.remember(user)),
    );
  }

  register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ): Observable<AuthUser> {
    return this.ensureCsrf().pipe(
      switchMap(() =>
        this.http.post<AuthUser>(
          appUrl('/register'),
          {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
          },
          { withCredentials: true },
        ),
      ),
      tap((user) => this.remember(user)),
    );
  }

  logout(): Observable<void> {
    return this.ensureCsrf().pipe(
      switchMap(() => this.http.post(appUrl('/logout'), {}, { withCredentials: true })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 419)) {
          return of(null);
        }
        return throwError(() => error);
      }),
      map(() => undefined),
      tap(() => this.remember(null)),
    );
  }

  private remember(user: AuthUser | null): void {
    this.user.set(user);
    this.ready.set(true);
  }

  private ensureCsrf(): Observable<void> {
    return this.http
      .get(appUrl('/sanctum/csrf-cookie'), {
        withCredentials: true,
        responseType: 'text',
        observe: 'response',
      })
      .pipe(
        tap((response) => rememberCsrfToken(response.headers.get('X-CSRF-TOKEN'))),
        map(() => undefined),
      );
  }
}

/** Keeps a post-login redirect inside the application. */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  if (
    value === '/login' ||
    value.startsWith('/login?') ||
    value === '/register' ||
    value.startsWith('/register?')
  ) {
    return '/';
  }
  return value;
}

/** Reads a Laravel validation or CSRF failure into text the form can show. */
export function readAuthError(error: unknown): AuthFailure {
  if (!(error instanceof HttpErrorResponse)) {
    return { message: 'FRAME could not reach the server. Try again.', fields: {} };
  }
  if (error.status === 419) {
    return { message: 'This form expired. Submit it again.', fields: {} };
  }

  const body = error.error;
  const errors = body && typeof body === 'object' && 'errors' in body ? body.errors : undefined;
  if (errors && typeof errors === 'object') {
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(errors)) {
      if (Array.isArray(value) && typeof value[0] === 'string') {
        fields[key] = value[0];
      }
    }
    if (Object.keys(fields).length > 0) {
      return { message: null, fields };
    }
  }

  return { message: 'The request could not be completed.', fields: {} };
}
