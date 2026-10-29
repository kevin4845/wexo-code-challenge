import { computed, Service, signal } from '@angular/core';

import { type MovieSummary } from '../models/movie';

const storageKey = 'frame.wishlist';

/**
 * Saved films for this browser. The collection is a signal so cards, the hero
 * and the wishlist page stay in sync without a global store.
 */
@Service()
export class Wishlist {
  private readonly movies = signal<readonly MovieSummary[]>(readStoredMovies());

  readonly items = this.movies.asReadonly();
  readonly count = computed(() => this.movies().length);

  isSaved(id: number): boolean {
    return this.movies().some((movie) => movie.id === id);
  }

  toggle(movie: MovieSummary): void {
    const next = this.isSaved(movie.id)
      ? this.movies().filter((item) => item.id !== movie.id)
      : [storeable(movie), ...this.movies()];
    this.movies.set(next);
    this.persist(next);
  }

  private persist(movies: readonly MovieSummary[]): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(movies));
    } catch {
      // The in-memory list still updates when storage is unavailable.
    }
  }
}

function storeable(movie: MovieSummary): MovieSummary {
  return {
    ...movie,
    overview: movie.overview.slice(0, 400),
  };
}

function readStoredMovies(): MovieSummary[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap(toStoredMovie);
  } catch {
    // Private mode and corrupt JSON both fall back to an empty list.
    return [];
  }
}

function toStoredMovie(value: unknown): MovieSummary[] {
  if (typeof value !== 'object' || value === null) {
    return [];
  }

  const movie = value as Record<string, unknown>;
  if (typeof movie['id'] !== 'number' || typeof movie['title'] !== 'string') {
    return [];
  }

  return [
    {
      id: movie['id'],
      title: movie['title'],
      overview: typeof movie['overview'] === 'string' ? movie['overview'] : '',
      posterPath: typeof movie['posterPath'] === 'string' ? movie['posterPath'] : null,
      backdropPath: typeof movie['backdropPath'] === 'string' ? movie['backdropPath'] : null,
      releaseYear: typeof movie['releaseYear'] === 'string' ? movie['releaseYear'] : null,
      releaseDate: typeof movie['releaseDate'] === 'string' ? movie['releaseDate'] : null,
      voteAverage: typeof movie['voteAverage'] === 'number' ? movie['voteAverage'] : null,
      genreIds: numberList(movie['genreIds']),
      genreNames: stringList(movie['genreNames']),
    },
  ];
}

function numberList(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number')
    : [];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
