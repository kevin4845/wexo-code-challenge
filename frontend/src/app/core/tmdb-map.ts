import {
  EMPTY_CREDITS,
  EMPTY_MOVIE_PAGE,
  type CastMember,
  type CrewCredit,
  type MovieCredits,
  type MovieDetails,
  type MoviePage,
  type MovieSummary,
  type MovieTrailer,
} from './models/movie';

/**
 * TMDB payloads are treated as untrusted JSON. Missing fields become null
 * so templates never render "undefined", and a film without an id or title is dropped.
 */

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function text(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function numeric(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function releaseDate(source: Record<string, unknown>): string | null {
  return text(source, 'release_date') ?? text(source, 'first_air_date');
}

function releaseYear(date: string | null): string | null {
  if (!date || !/^\d{4}/.test(date)) {
    return null;
  }
  return date.slice(0, 4);
}

/** A zero average, or a title nobody has rated, is treated as "no rating" rather than 0.0. */
function voteAverage(source: Record<string, unknown>): number | null {
  const count = numeric(source, 'vote_count');
  const average = numeric(source, 'vote_average');
  if (count === null || count <= 0 || average === null || average <= 0) {
    return null;
  }
  return average;
}

function genreIds(source: Record<string, unknown>): number[] {
  const value = source['genre_ids'];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
}

export function parseMovie(value: unknown): MovieSummary | null {
  const source = record(value);
  if (!source) {
    return null;
  }

  const id = numeric(source, 'id');
  const title = text(source, 'title') ?? text(source, 'name');
  if (id === null || !title) {
    return null;
  }

  const date = releaseDate(source);
  return {
    id,
    title,
    overview: text(source, 'overview') ?? '',
    posterPath: text(source, 'poster_path'),
    backdropPath: text(source, 'backdrop_path'),
    releaseDate: date,
    releaseYear: releaseYear(date),
    voteAverage: voteAverage(source),
    genreIds: genreIds(source),
    genreNames: [],
  };
}

export function parseMoviePage(value: unknown): MoviePage {
  const source = record(value);
  if (!source) {
    return EMPTY_MOVIE_PAGE;
  }

  const results = source['results'];
  const movies = Array.isArray(results)
    ? results.map(parseMovie).filter((movie): movie is MovieSummary => movie !== null)
    : [];

  return {
    movies,
    totalResults: Math.max(0, numeric(source, 'total_results') ?? movies.length),
    page: numeric(source, 'page') ?? 1,
    totalPages: numeric(source, 'total_pages') ?? 0,
  };
}

export function parseGenreMap(value: unknown): Map<number, string> {
  const source = record(value);
  const list = source?.['genres'];
  const names = new Map<number, string>();
  if (!Array.isArray(list)) {
    return names;
  }

  for (const item of list) {
    const genre = record(item);
    if (!genre) {
      continue;
    }
    const id = numeric(genre, 'id');
    const name = text(genre, 'name');
    if (id !== null && name) {
      names.set(id, name);
    }
  }
  return names;
}

export function parseMovieDetails(value: unknown): MovieDetails | null {
  const source = record(value);
  const summary = parseMovie(value);
  if (!source || !summary) {
    return null;
  }

  const genres = Array.isArray(source['genres'])
    ? source['genres'].flatMap((item) => {
        const genre = record(item);
        if (!genre) {
          return [];
        }
        const id = numeric(genre, 'id');
        const name = text(genre, 'name');
        return id !== null && name ? [{ id, name }] : [];
      })
    : [];

  const runtime = numeric(source, 'runtime');
  return {
    id: summary.id,
    title: summary.title,
    overview: summary.overview,
    posterPath: summary.posterPath,
    backdropPath: summary.backdropPath,
    releaseYear: summary.releaseYear,
    releaseDate: summary.releaseDate,
    voteAverage: summary.voteAverage,
    runtime: runtime !== null && runtime > 0 ? runtime : null,
    genres,
    tagline: text(source, 'tagline'),
    originalLanguage: text(source, 'original_language'),
    status: text(source, 'status'),
  };
}

function parseCast(value: unknown): CastMember | null {
  const source = record(value);
  if (!source) {
    return null;
  }
  const id = numeric(source, 'id');
  const name = text(source, 'name');
  if (id === null || !name) {
    return null;
  }
  return {
    id,
    name,
    character: text(source, 'character') ?? 'Cast',
    profilePath: text(source, 'profile_path'),
  };
}

function parseCrew(value: unknown): (CrewCredit & { order: number }) | null {
  const source = record(value);
  if (!source) {
    return null;
  }
  const id = numeric(source, 'id');
  const name = text(source, 'name');
  const job = text(source, 'job');
  if (id === null || !name || !job) {
    return null;
  }
  return {
    id,
    name,
    job,
    profilePath: text(source, 'profile_path'),
    order: numeric(source, 'order') ?? 999,
  };
}

export function parseCredits(value: unknown): MovieCredits {
  const source = record(value);
  if (!source) {
    return EMPTY_CREDITS;
  }

  const cast = Array.isArray(source['cast'])
    ? source['cast']
        .map((item) => ({
          person: parseCast(item),
          order: numeric(record(item) ?? {}, 'order') ?? 999,
        }))
        .filter((item): item is { person: CastMember; order: number } => item.person !== null)
        .sort((a, b) => a.order - b.order)
        .map((item) => item.person)
    : [];

  const crew = Array.isArray(source['crew'])
    ? source['crew']
        .map(parseCrew)
        .filter((person): person is CrewCredit & { order: number } => person !== null)
    : [];

  const director = crew.find((person) => person.job === 'Director') ?? null;
  const writerJobs = new Set(['Writer', 'Screenplay', 'Story']);
  const writers: CrewCredit[] = [];
  for (const person of crew) {
    if (!writerJobs.has(person.job) || writers.some((writer) => writer.id === person.id)) {
      continue;
    }
    writers.push(person);
    if (writers.length === 3) {
      break;
    }
  }

  return { cast, director, writers };
}

/** Prefers an official YouTube trailer, then any trailer, then a teaser. */
export function parseTrailer(value: unknown): MovieTrailer | null {
  const source = record(value);
  const results = source?.['results'];
  if (!Array.isArray(results)) {
    return null;
  }

  const videos = results.flatMap((item) => {
    const video = record(item);
    if (!video || text(video, 'site') !== 'YouTube') {
      return [];
    }
    const key = text(video, 'key');
    if (!key) {
      return [];
    }
    return [
      {
        key,
        name: text(video, 'name') ?? 'Trailer',
        type: text(video, 'type') ?? '',
        official: video['official'] === true,
      },
    ];
  });

  const match =
    videos.find((video) => video.type === 'Trailer' && video.official) ??
    videos.find((video) => video.type === 'Trailer') ??
    videos.find((video) => video.type === 'Teaser');

  return match ? { key: match.key, name: match.name } : null;
}
