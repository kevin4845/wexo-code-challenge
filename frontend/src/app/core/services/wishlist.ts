import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Service, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { appUrl } from '../interceptors/sanctum';
import { type MovieSummary } from '../models/movie';
import { parseMovie } from '../tmdb-map';
import { Auth } from './auth';

const storageKey = 'frame.wishlist';

interface WishlistPayload {
  readonly ids: readonly number[];
  readonly movies: readonly unknown[];
}

/**
 * The signed-in user's saved films. The list is a signal so cards, the hero,
 * and the wishlist page stay in sync. The database is the source of truth.
 */
@Service()
export class Wishlist {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly movies = signal<readonly MovieSummary[]>([]);
  private readonly savedIds = signal<ReadonlySet<number>>(new Set());
  private fetchGeneration = 0;

  readonly items = this.movies.asReadonly();
  readonly count = computed(() => this.movies().length);
  readonly loadError = signal(false);
  readonly ready = signal(false);

  constructor() {
    // Reload when the signed-in user changes. untracked keeps the writes below from running this again.
    effect(() => {
      const ready = this.auth.initialized();
      const userId = this.auth.currentUser()?.id ?? null;
      if (!ready) {
        return;
      }

      untracked(() => {
        if (userId === null) {
          this.fetchGeneration += 1;
          this.movies.set([]);
          this.savedIds.set(new Set());
          this.loadError.set(false);
          this.ready.set(false);
          return;
        }
        this.fetch();
      });
    });
  }

  isSaved(id: number): boolean {
    return this.savedIds().has(id);
  }

  toggle(movie: MovieSummary): void {
    if (!this.auth.isAuthenticated()) {
      this.sendToLogin();
      return;
    }

    // A newer toggle or sign-out must be allowed to discard an older list response.
    this.fetchGeneration += 1;
    if (this.isSaved(movie.id)) {
      this.remove(movie.id);
      return;
    }
    this.add(movie);
  }

  private fetch(): void {
    const generation = ++this.fetchGeneration;
    this.loadError.set(false);

    this.http.get<WishlistPayload>(appUrl('/api/wishlist'), { withCredentials: true }).subscribe({
      next: (payload) => {
        if (generation !== this.fetchGeneration) {
          // A newer sign-in or toggle owns the list now.
          return;
        }
        this.apply(payload);
        this.ready.set(true);
        this.migrate(payload.ids);
      },
      error: (error: unknown) => {
        if (generation !== this.fetchGeneration) {
          return;
        }
        if (this.unauthorized(error)) {
          return;
        }
        this.loadError.set(true);
        this.ready.set(true);
      },
    });
  }

  private add(movie: MovieSummary): void {
    // Show the save immediately. A rejected request puts the previous list back.
    const previousMovies = this.movies();
    const previousIds = this.savedIds();
    this.movies.set([movie, ...previousMovies.filter((item) => item.id !== movie.id)]);
    this.savedIds.set(new Set([movie.id, ...previousIds]));

    this.http
      .post<unknown>(
        appUrl('/api/wishlist'),
        { tmdb_movie_id: movie.id },
        { withCredentials: true },
      )
      .subscribe({
        next: (payload) => {
          const saved = parseMovie(payload);
          if (!saved) {
            return;
          }
          this.movies.set(this.movies().map((item) => (item.id === saved.id ? saved : item)));
        },
        error: (error: unknown) => {
          if (this.unauthorized(error)) {
            return;
          }
          this.movies.set(previousMovies);
          this.savedIds.set(previousIds);
        },
      });
  }

  private remove(id: number): void {
    const previousMovies = this.movies();
    const previousIds = this.savedIds();
    const nextIds = new Set(previousIds);
    nextIds.delete(id);
    this.movies.set(previousMovies.filter((item) => item.id !== id));
    this.savedIds.set(nextIds);

    this.http.delete(appUrl(`/api/wishlist/${id}`), { withCredentials: true }).subscribe({
      error: (error: unknown) => {
        // Already gone on the server. Keep the local removal.
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return;
        }
        if (this.unauthorized(error)) {
          return;
        }
        this.movies.set(previousMovies);
        this.savedIds.set(previousIds);
      },
    });
  }

  /** Copies a browser-saved list into this account once, then drops the local copy. */
  private migrate(savedIds: readonly number[]): void {
    const localIds = readLocalMovieIds();
    if (localIds === null) {
      return;
    }

    const missing = localIds.filter((id) => !savedIds.includes(id));
    if (missing.length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }

    const requests = missing.map((id) =>
      this.http.post<unknown>(
        appUrl('/api/wishlist'),
        { tmdb_movie_id: id },
        { withCredentials: true },
      ),
    );

    forkJoin(requests).subscribe({
      next: () => {
        localStorage.removeItem(storageKey);
        this.fetch();
      },
      error: () => {
        // Keep the browser copy so the next signed-in session can try again.
      },
    });
  }

  private apply(payload: WishlistPayload): void {
    const movies = payload.movies
      .map((movie) => parseMovie(movie))
      .filter((movie): movie is MovieSummary => movie !== null);
    this.movies.set(movies);
    this.savedIds.set(new Set(payload.ids));
  }

  private unauthorized(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return false;
    }
    this.movies.set([]);
    this.savedIds.set(new Set());
    this.sendToLogin();
    return true;
  }

  private sendToLogin(): void {
    const returnUrl = this.router.url.startsWith('/') ? this.router.url : '/';
    void this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }
}

function readLocalMovieIds(): number[] | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(storageKey);
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap(movieId);
  } catch {
    return [];
  }
}

function movieId(value: unknown): number[] {
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const id = (value as Record<string, unknown>)['id'];
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? [id] : [];
}
