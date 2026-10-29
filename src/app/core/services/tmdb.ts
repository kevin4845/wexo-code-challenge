import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, forkJoin, map, type Observable, shareReplay, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  type GenreSort,
  type MovieCredits,
  type MovieDetails,
  type MoviePage,
  type MovieSummary,
  type MovieTrailer,
} from '../models/movie';
import {
  parseCredits,
  parseGenreMap,
  parseMovieDetails,
  parseMoviePage,
  parseTrailer,
} from '../tmdb-map';
import { TmdbConfigError } from './tmdb-auth';

/**
 * The only place that talks to TMDB. Pages ask for films; they do not build request URLs.
 * Successful responses are memoized for the session so a genre row and its genre page share one request.
 */
@Service()
export class Tmdb {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<unknown>>();

  isConfigured(): boolean {
    const { apiKey, apiBaseUrl } = environment.tmdb;
    return apiKey.trim().length > 0 && apiBaseUrl.trim().length > 0;
  }

  /** A current popular film that has a backdrop, used as the homepage hero. */
  featured(): Observable<MovieSummary | null> {
    return this.memo('featured', () =>
      forkJoin({
        page: this.get('/movie/popular').pipe(map(parseMoviePage)),
        genres: this.genreNames(),
      }).pipe(
        map(({ page, genres }) => {
          const movie = page.movies.find((item) => item.backdropPath) ?? page.movies[0] ?? null;
          return movie ? this.withGenreNames(movie, genres) : null;
        }),
      ),
    );
  }

  /**
   * First page of films for a TMDB genre.
   * `latest` and `top-rated` change the sort; top rated ignores titles with very few votes.
   */
  moviesByGenre(genreId: number, sort: GenreSort = 'popular'): Observable<MoviePage> {
    if (!Number.isFinite(genreId)) {
      return throwError(() => new Error('Unknown genre.'));
    }

    return this.memo(`genre:${genreId}:${sort}`, () =>
      this.get('/discover/movie', {
        with_genres: genreId,
        page: 1,
        ...sortParams(sort),
      }).pipe(map(parseMoviePage)),
    );
  }

  /** Title search. An empty query does not call the API. */
  search(query: string): Observable<MoviePage> {
    const term = query.trim();
    if (!term) {
      return throwError(() => new Error('Enter a film title to search.'));
    }

    return this.get('/search/movie', { query: term, page: 1 }).pipe(map(parseMoviePage));
  }

  movie(id: number): Observable<MovieDetails> {
    return this.memo(`movie:${id}`, () =>
      this.get(`/movie/${id}`).pipe(
        map((body) => {
          const details = parseMovieDetails(body);
          if (!details) {
            throw new Error('Film details were incomplete.');
          }
          return details;
        }),
      ),
    );
  }

  credits(id: number): Observable<MovieCredits> {
    return this.memo(`credits:${id}`, () =>
      this.get(`/movie/${id}/credits`).pipe(map(parseCredits)),
    );
  }

  /** YouTube trailer when TMDB has one. Null means the page should hide the trailer action. */
  trailer(id: number): Observable<MovieTrailer | null> {
    return this.memo(`trailer:${id}`, () =>
      this.get(`/movie/${id}/videos`).pipe(map(parseTrailer)),
    );
  }

  /** Up to 12 related films for the detail page. */
  similar(id: number): Observable<readonly MovieSummary[]> {
    return this.memo(`similar:${id}`, () =>
      this.get(`/movie/${id}/similar`).pipe(
        map((body) => parseMoviePage(body).movies.slice(0, 12)),
      ),
    );
  }

  private genreNames(): Observable<ReadonlyMap<number, string>> {
    return this.memo('genre-names', () => this.get('/genre/movie/list').pipe(map(parseGenreMap)));
  }

  private withGenreNames(movie: MovieSummary, names: ReadonlyMap<number, string>): MovieSummary {
    return {
      ...movie,
      genreNames: movie.genreIds.flatMap((id) => {
        const name = names.get(id);
        return name ? [name] : [];
      }),
    };
  }

  private get(
    path: string,
    params: Record<string, string | number | boolean> = {},
  ): Observable<unknown> {
    if (!this.isConfigured()) {
      return throwError(() => new TmdbConfigError());
    }

    return this.http.get<unknown>(`${environment.tmdb.apiBaseUrl}${path}`, {
      params: { language: 'en-US', include_adult: false, ...params },
    });
  }

  private memo<T>(key: string, create: () => Observable<T>): Observable<T> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached as Observable<T>;
    }

    // Drop failed requests from the cache so a later retry can hit the network again.
    const request = create().pipe(
      catchError((error: unknown) => {
        this.cache.delete(key);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(key, request);
    return request;
  }
}

function sortParams(sort: GenreSort): Record<string, string | number | boolean> {
  if (sort === 'latest') {
    return { sort_by: 'primary_release_date.desc' };
  }
  if (sort === 'top-rated') {
    return { sort_by: 'vote_average.desc', 'vote_count.gte': 200 };
  }
  return { sort_by: 'popularity.desc' };
}
